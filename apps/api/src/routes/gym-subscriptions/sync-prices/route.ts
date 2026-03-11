import {
  GYM_PLANS_CONFIG,
  centsToReais,
} from "@/lib/access-control/plans-config";
import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

export const POST = createSafeHandler(
  async ({ gymContext }) => {
    const gymId = gymContext!.gymId;
    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        message: "Sem assinatura para sincronizar",
        updated: false,
      });
    }

    const planKey =
      subscription.plan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG;
    const config = GYM_PLANS_CONFIG[planKey];

    if (!config) {
      return NextResponse.json(
        { error: "Plano atual inválido na configuração" },
        { status: 400 },
      );
    }

    const billingPeriod = subscription.billingPeriod as "monthly" | "annual";
    const newBasePrice = centsToReais(config.prices[billingPeriod]);
    const newPerStudentPrice =
      billingPeriod === "annual" ? 0 : centsToReais(config.pricePerStudent);

    if (
      subscription.basePrice === newBasePrice &&
      subscription.pricePerStudent === newPerStudentPrice
    ) {
      return NextResponse.json({ success: true, updated: false });
    }

    await db.gymSubscription.update({
      where: { id: subscription.id },
      data: {
        basePrice: newBasePrice,
        pricePerStudent: newPerStudentPrice,
      },
    });

    return NextResponse.json({ success: true, updated: true });
  },
  {
    auth: "gym",
  },
);
