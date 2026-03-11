import { NextResponse } from "@/runtime/next-server";
import {
  GYM_PLANS_CONFIG,
  centsToReais,
} from "@/lib/access-control/plans-config";
import { createGymSubscriptionSchema } from "@/lib/api/schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";
import { db } from "@/lib/db";
import { createGymSubscriptionPix } from "@/lib/utils/subscription";

export const POST = createSafeHandler(
  async ({ gymContext, body }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Academia não encontrada" },
        { status: 401 },
      );
    }

    const {
      plan = "basic",
      billingPeriod = "monthly",
      referralCode,
    } = body as {
      plan?: string;
      billingPeriod?: string;
      referralCode?: string;
    };
    const safePlan = plan as string;
    const safeBillingPeriod = billingPeriod as "monthly" | "annual";

    const config =
      GYM_PLANS_CONFIG[safePlan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG];
    if (!config) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });
    const activePersonals = await db.gymPersonalAffiliation.count({
      where: { gymId, status: "active" },
    });

    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    let canApplyReferral = true;
    if (existingSubscription?.id) {
      const hasEverPaid = await db.subscriptionPayment.count({
        where: {
          gymSubscriptionId: existingSubscription.id,
          status: "succeeded",
        },
      });
      const isTrialActive =
        existingSubscription.status === "trialing" &&
        !!existingSubscription.trialEnd &&
        new Date(existingSubscription.trialEnd).getTime() > Date.now();
      const hasHistoricalPaidStatus = ["active", "canceled", "expired"].includes(
        existingSubscription.status,
      );
      canApplyReferral =
        isTrialActive || (!hasHistoricalPaidStatus && hasEverPaid === 0);
    }

    if (referralCode && !canApplyReferral) {
      return NextResponse.json(
        {
          error:
            "Indicação disponível apenas para primeira assinatura ou trial ativo.",
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const basePrice = centsToReais(config.prices[safeBillingPeriod]);
    const pricePerStudent =
      safeBillingPeriod === "annual" ? 0 : centsToReais(config.pricePerStudent);
    const pricePerPersonal =
      safeBillingPeriod === "annual"
        ? 0
        : centsToReais(config.pricePerPersonal ?? 0);

    let subscriptionId = existingSubscription?.id;

    if (existingSubscription) {
      await db.gymSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: safePlan,
          billingPeriod: safeBillingPeriod,
          status: "pending",
          basePrice,
          pricePerStudent,
          pricePerPersonal,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      const created = await db.gymSubscription.create({
        data: {
          gymId,
          plan: safePlan,
          billingPeriod: safeBillingPeriod,
          status: "pending",
          basePrice,
          pricePerStudent,
          pricePerPersonal,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
      subscriptionId = created.id;
    }

    let referralCodeInvalid = false;
    if (referralCode) {
      const resolved = await ReferralService.resolveReferral(
        referralCode.startsWith("@") ? referralCode : `@${referralCode}`,
        "GYM",
        gymId,
      );
      if (!resolved) {
        referralCodeInvalid = true;
      }
    }

    const pix = await createGymSubscriptionPix(
      gymId,
      safePlan as "basic" | "premium" | "enterprise",
      activeStudents,
      safeBillingPeriod,
      subscriptionId!,
      { referralCode: referralCode || null },
    );

    if (!pix || !pix.id) {
      return NextResponse.json(
        { error: "Erro ao criar PIX: resposta inválida da AbacatePay" },
        { status: 500 },
      );
    }

    if (subscriptionId) {
      await db.gymSubscription.update({
        where: { id: subscriptionId },
        data: { abacatePayBillingId: pix.id },
      });
    }

    return NextResponse.json({
      pixId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      amount: pix.amount,
      activePersonals,
      canApplyReferral,
      ...(referralCodeInvalid && { referralCodeInvalid: true }),
    });
  },
  {
    auth: "gym",
    schema: { body: createGymSubscriptionSchema },
  },
);
