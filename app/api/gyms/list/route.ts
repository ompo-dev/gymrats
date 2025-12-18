import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export async function GET(request: NextRequest) {
  try {
    const sessionToken =
      request.cookies.get("auth_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const userId = session.userId;

    // Buscar todas as academias do usuário
    const gyms = await db.gym.findMany({
      where: { userId },
      include: {
        subscription: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Verificar se alguma academia tem assinatura ativa (não trial)
    const hasActiveSubscription = gyms.some((gym) => {
      if (!gym.subscription) return false;

      const now = new Date();
      const isTrialActive =
        gym.subscription.trialEnd && new Date(gym.subscription.trialEnd) > now;
      const isActive = gym.subscription.status === "active";
      const isTrialing = gym.subscription.status === "trialing";

      // Tem assinatura ativa se:
      // 1. Status é active (pago)
      // 2. OU Status é trialing E trial ainda não expirou
      return isActive || (isTrialing && isTrialActive);
    });

    // Verificar se tem pelo menos uma academia com plano pago (não trial)
    const hasPaidSubscription = gyms.some((gym) => {
      if (!gym.subscription) return false;
      return gym.subscription.status === "active";
    });

    // Usuário só pode criar múltiplas academias se tiver pelo menos UMA com plano ativo (não trial)
    const canCreateMultipleGyms = hasPaidSubscription;

    const gymsData = gyms.map((gym) => {
      const now = new Date();
      const gymHasActiveSubscription = gym.subscription
        ? gym.subscription.status === "active" ||
          (gym.subscription.status === "trialing" &&
            gym.subscription.trialEnd &&
            new Date(gym.subscription.trialEnd) > now)
        : false;

      return {
        id: gym.id,
        name: gym.name,
        logo: gym.logo,
        address: gym.address,
        email: gym.email,
        plan: gym.plan,
        isActive: gym.isActive,
        hasActiveSubscription: gymHasActiveSubscription,
      };
    });

    return NextResponse.json({
      gyms: gymsData,
      canCreateMultipleGyms,
      totalGyms: gyms.length,
    });
  } catch (error: any) {
    console.error("Erro ao listar academias:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao listar academias" },
      { status: 500 }
    );
  }
}
