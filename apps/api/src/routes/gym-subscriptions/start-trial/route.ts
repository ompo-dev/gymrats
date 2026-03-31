import {
  centsToReais,
  GYM_PLANS_CONFIG,
} from "@/lib/access-control/plans-config";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { NextResponse } from "@/runtime/next-server";

export const POST = createSafeHandler(
  async ({ gymContext }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 401 },
      );
    }
    const safeGymId = gymId as string;

    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId: safeGymId },
    });

    if (existingSubscription) {
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
        gymId: safeGymId,
        plan: "basic",
        billingPeriod: "monthly",
        status: "trialing",
        basePrice: centsToReais(GYM_PLANS_CONFIG.BASIC.prices.monthly),
        pricePerStudent: centsToReais(GYM_PLANS_CONFIG.BASIC.pricePerStudent),
        pricePerPersonal: centsToReais(
          GYM_PLANS_CONFIG.BASIC.pricePerPersonal ?? 0,
        ),
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
