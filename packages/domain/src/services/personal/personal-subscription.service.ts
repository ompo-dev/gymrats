import { centsToReais } from "@gymrats/access-control/plans-config";
import { db } from "@gymrats/db";
import {
  calculatePersonalSubscriptionPricing,
  type PersonalSubscriptionPricingResult,
} from "../../subscription";

type PersonalPlanInput = "standard" | "pro_ai";
type BillingPeriodInput = "monthly" | "annual";

export class PersonalSubscriptionService {
  static async hasPremiumOrEnterpriseAffiliation(
    personalId: string,
  ): Promise<boolean> {
    const affiliation = await db.gymPersonalAffiliation.findFirst({
      where: {
        personalId,
        status: "active",
        gym: {
          subscription: {
            status: "active",
            plan: { in: ["premium", "enterprise"] },
          },
        },
      },
      select: { id: true },
    });

    return !!affiliation;
  }

  private static toReaisPricing(pricing: PersonalSubscriptionPricingResult) {
    return {
      basePrice: centsToReais(pricing.basePrice),
      effectivePrice: centsToReais(pricing.effectivePrice),
      discountPercent: pricing.discountPercent || null,
    };
  }

  static async upsertSubscription(input: {
    personalId: string;
    plan: PersonalPlanInput;
    billingPeriod: BillingPeriodInput;
  }) {
    const { personalId, plan, billingPeriod } = input;
    const hasDiscount =
      await PersonalSubscriptionService.hasPremiumOrEnterpriseAffiliation(
        personalId,
      );

    const pricing = calculatePersonalSubscriptionPricing({
      plan,
      billingPeriod,
      hasPremiumOrEnterpriseAffiliation: hasDiscount,
    });
    const reais = PersonalSubscriptionService.toReaisPricing(pricing);

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return db.personalSubscription.upsert({
      where: { personalId },
      create: {
        personalId,
        plan,
        billingPeriod,
        status: "pending_payment",
        basePrice: reais.basePrice,
        effectivePrice: reais.effectivePrice,
        discountPercent: reais.discountPercent,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan,
        billingPeriod,
        status: "pending_payment",
        basePrice: reais.basePrice,
        effectivePrice: reais.effectivePrice,
        discountPercent: reais.discountPercent,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  static async recalculateEffectivePrice(personalId: string) {
    const subscription = await db.personalSubscription.findUnique({
      where: { personalId },
    });
    if (!subscription) return null;

    const hasDiscount =
      await PersonalSubscriptionService.hasPremiumOrEnterpriseAffiliation(
        personalId,
      );

    const pricing = calculatePersonalSubscriptionPricing({
      plan: subscription.plan as PersonalPlanInput,
      billingPeriod: subscription.billingPeriod as BillingPeriodInput,
      hasPremiumOrEnterpriseAffiliation: hasDiscount,
    });
    const reais = PersonalSubscriptionService.toReaisPricing(pricing);

    return db.personalSubscription.update({
      where: { id: subscription.id },
      data: {
        basePrice: reais.basePrice,
        effectivePrice: reais.effectivePrice,
        discountPercent: reais.discountPercent,
      },
    });
  }
}
