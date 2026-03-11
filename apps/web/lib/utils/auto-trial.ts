import {
  GYM_PLANS_CONFIG,
  centsToReais,
} from "@/lib/access-control/plans-config";
import { db } from "@/lib/db";

export type StudentTrialResult =
  | {
      success: true;
      subscription: Awaited<ReturnType<typeof db.subscription.create>>;
    }
  | { success: false; reason: "already_used_trial" | "already_subscribed" };

/**
 * Trial só pode ser ativado uma vez por aluno.
 * Se já usou trial (trialStart preenchido) ou já assinou um plano (plan !== "free"), não permite mais trial.
 * Trial = 14 dias de acesso premium. Cancelar trial ou assinar durante o trial = nunca mais trial.
 */
export async function initializeStudentTrial(
  studentId: string,
): Promise<StudentTrialResult | null> {
  try {
    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    // Já usou trial (cancelou ou assinou durante o trial = trialStart fica preenchido para sempre)
    if (existingSubscription?.trialStart) {
      return { success: false, reason: "already_used_trial" };
    }

    // Já assinou um plano pago (basic/premium) → trial não é mais possível
    if (existingSubscription && existingSubscription.plan !== "free") {
      return { success: false, reason: "already_subscribed" };
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    // Plano free sem trial ainda: atualizar para trial (14 dias premium)
    if (existingSubscription) {
      const subscription = await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: "premium",
          status: "trialing",
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialStart: now,
          trialEnd: trialEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
      return { success: true, subscription };
    }

    // Sem registro: criar assinatura em trial
    const subscription = await db.subscription.create({
      data: {
        studentId,
        plan: "premium",
        status: "trialing",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
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

    const _activeStudents = await db.gymMembership.count({
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
        billingPeriod: "monthly", // Trial sempre é mensal
        status: "trialing",
        basePrice: centsToReais(GYM_PLANS_CONFIG.BASIC.prices.monthly),
        pricePerStudent: centsToReais(GYM_PLANS_CONFIG.BASIC.pricePerStudent),
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
      },
    });

    return subscription;
  } catch (error) {
    console.error("Erro ao inicializar trial da academia:", error);
    return null;
  }
}
