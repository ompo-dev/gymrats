import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { featureFlags } from "@/lib/feature-flags";

export const POST = createSafeHandler(
  async ({ personalContext }) => {
    if (!featureFlags.personalEnabled || !featureFlags.personalBillingEnabled) {
      return NextResponse.json(
        { error: "Billing de Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId;
    if (!personalId) {
      return NextResponse.json(
        { error: "Personal não autenticado" },
        { status: 401 },
      );
    }

    const subscription = await db.personalSubscription.findUnique({
      where: { personalId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 },
      );
    }

    await db.personalSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      message: "Assinatura cancelada com sucesso",
    });
  },
  { auth: "personal" },
);
