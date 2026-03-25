import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { GymSubscriptionService } from "@/lib/services/gym/gym-subscription.service";
import { NextResponse } from "@/runtime/next-server";

export const POST = createSafeHandler(
  async ({ gymContext }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Contexto da academia invalido" },
        { status: 400 },
      );
    }

    const gym = await db.gym.findUnique({
      where: { id: gymId },
      select: { userId: true },
    });
    if (!gym) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 404 },
      );
    }

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });
    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    // Só quando a academia MAIS ANTIGA (primeira criada) cancela é que as demais perdem o plano
    const allGymsByAge = await db.gym.findMany({
      where: { userId: gym.userId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    const oldestGymId = allGymsByAge[0]?.id;
    const isOldestCancelling = oldestGymId === gymId;

    if (isOldestCancelling) {
      // Academia principal cancelou: cancelar assinatura de TODAS; marcar as outras para poder restaurar quando a principal voltar
      const gymIds = allGymsByAge.map((g) => g.id);
      const otherGymIds = gymIds.filter((id) => id !== oldestGymId);

      // Principal: cancelar sem flag (não é restaurada automaticamente)
      await db.gymSubscription.updateMany({
        where: { gymId: oldestGymId },
        data: {
          status: "canceled",
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });
      // Demais: cancelar COM flag para restaurar quando principal reassinar (se período não tiver expirado)
      if (otherGymIds.length > 0) {
        await db.gymSubscription.updateMany({
          where: { gymId: { in: otherGymIds } },
          data: {
            status: "canceled",
            canceledAt: new Date(),
            cancelAtPeriodEnd: false,
            canceledBecausePrincipalCanceled: true,
          },
        });
      }
      for (const gid of gymIds) {
        await GymSubscriptionService.handleGymDowngrade(gid);
      }
    } else {
      // Academia que veio depois cancelou: só esta perde o plano
      await db.gymSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "canceled",
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });
      await GymSubscriptionService.handleGymDowngrade(gymId);
    }

    return NextResponse.json({
      message: "Assinatura cancelada com sucesso",
    });
  },
  {
    auth: "gym",
  },
);
