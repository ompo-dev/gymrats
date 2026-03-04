import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { getTimeMs } from "@/lib/utils/date-safe";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const gymId = gymContext?.gymId;
    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        canStartTrial: true,
        isFirstPayment: true,
      });
    }

    // Se expirou trial ou cancelado, ainda assim retornamos o objeto para o frontend saber o histórico (ex.: canStartTrial: false)
    const _isCanceledAndExpired =
      subscription.status === "canceled" &&
      (!subscription.trialEnd ||
        (getTimeMs(subscription.trialEnd) ?? 0) < Date.now());

    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    const trialEndMs = getTimeMs(subscription.trialEnd);
    const isTrial = !!subscription.trialEnd && (trialEndMs ?? 0) > Date.now();
    const daysRemaining =
      trialEndMs != null
        ? Math.max(0, Math.ceil((trialEndMs - Date.now()) / (1000 * 3600 * 24)))
        : null;

    // totalAmount: anual usa o preço base (já anualizado), mensal usa base + por aluno
    const totalAmount =
      subscription.billingPeriod === "annual"
        ? subscription.basePrice
        : subscription.basePrice +
          subscription.pricePerStudent * activeStudents;

    // Elegibilidade de indicação:
    // - Mostra durante trial
    // - Fora do trial, só mostra se nunca teve pagamento bem-sucedido
    const hasEverPaid = await db.subscriptionPayment.count({
      where: {
        gymSubscriptionId: subscription.id,
        status: "succeeded",
      },
    });
    const hasHistoricalPaidStatus = ["active", "canceled", "expired"].includes(
      subscription.status,
    );
    const isFirstPayment =
      isTrial || (!hasHistoricalPaidStatus && hasEverPaid === 0);

    return NextResponse.json({
      subscription: {
        ...subscription,
        billingPeriod: subscription.billingPeriod ?? "monthly",
        isTrial,
        daysRemaining,
        activeStudents,
        totalAmount,
        canStartTrial: false,
        isFirstPayment,
      },
      isFirstPayment,
    });
  },
  {
    auth: "gym",
  },
);
