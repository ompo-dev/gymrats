import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const POST = createSafeHandler(
  async ({ gymContext }) => {
    const gymId = gymContext?.gymId;
    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (existingSubscription) {
      // Se já existe uma assinatura (ativa, trial ou cancelada), não sobrescrevemos o histórico.
      // Especialmente importante para casos em que a academia foi cancelada por causa da principal
      // (canceledBecausePrincipalCanceled) e será restaurada automaticamente.
      return NextResponse.json(
        {
          error:
            "Já existe uma assinatura para esta academia. Conclua a renovação ou aguarde a restauração automática.",
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.gymSubscription.create({
      data: {
        gymId,
        plan: "basic",
        billingPeriod: "monthly",
        status: "trialing",
        basePrice: 150,
        pricePerStudent: 1.5,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
      },
    });

    return NextResponse.json({ success: true, subscription });
  },
  {
    auth: "gym",
  },
);
