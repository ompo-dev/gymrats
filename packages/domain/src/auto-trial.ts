import {
  centsToReais,
  GYM_PLANS_CONFIG,
} from "@gymrats/access-control/plans-config";
import { db } from "@gymrats/db";

export type StudentTrialResult =
  | {
      success: true;
      subscription: Awaited<ReturnType<typeof db.subscription.create>>;
    }
  | { success: false; reason: "already_used_trial" | "already_subscribed" };

/**
 * Trial can only be activated once per student.
 * If trialStart already exists or the user has subscribed to a paid plan,
 * trial cannot be granted again.
 */
export async function initializeStudentTrial(
  studentId: string,
): Promise<StudentTrialResult | null> {
  try {
    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (existingSubscription?.trialStart) {
      return { success: false, reason: "already_used_trial" };
    }

    if (existingSubscription && existingSubscription.plan !== "free") {
      return { success: false, reason: "already_subscribed" };
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    if (existingSubscription) {
      const subscription = await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: "premium",
          status: "trialing",
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
      return { success: true, subscription };
    }

    const subscription = await db.subscription.create({
      data: {
        studentId,
        plan: "premium",
        status: "trialing",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
      },
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Erro ao inicializar trial do aluno:", error);
    return null;
  }
}

export async function initializeGymTrial(gymId: string) {
  try {
    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (existingSubscription) {
      return existingSubscription;
    }

    await db.gymMembership.count({
      where: {
        gymId,
        status: "active",
      },
    });

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.gymSubscription.create({
      data: {
        gymId,
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

    return subscription;
  } catch (error) {
    console.error("Erro ao inicializar trial da academia:", error);
    return null;
  }
}
