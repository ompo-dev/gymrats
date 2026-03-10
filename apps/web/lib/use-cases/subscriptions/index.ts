/**
 * Use Case: Get Current Subscription
 */
import { db } from "@/lib/db";

export async function getCurrentSubscriptionUseCase(studentId: string) {
  const subscription = await db.subscription.findUnique({
    where: { studentId },
  });
  return { subscription: subscription ?? null };
}

/**
 * Use Case: Create Subscription
 */
export interface CreateSubscriptionInput {
  studentId: string;
  plan: "monthly" | "annual";
}

export async function createSubscriptionUseCase(
  input: CreateSubscriptionInput,
) {
  const { studentId, plan } = input;
  const now = new Date();
  const periodEnd = new Date(now);
  if (plan === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const subscription = await db.subscription.upsert({
    where: { studentId },
    update: {
      plan: "premium",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      studentId,
      plan: "premium",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialStart: null,
      trialEnd: null,
      canceledAt: null,
      cancelAtPeriodEnd: false,
    },
  });

  return { subscription, message: "Assinatura criada com sucesso" };
}

/**
 * Use Case: Start Trial
 */
export async function startTrialUseCase(studentId: string) {
  const existing = await db.subscription.findUnique({ where: { studentId } });

  if (existing?.trialStart) {
    throw new Error(
      "Você já utilizou o trial anteriormente. Trial só pode ser ativado uma vez.",
    );
  }
  if (existing && existing.plan !== "free") {
    throw new Error(
      "Você já possui uma assinatura. Renove ou escolha um plano para continuar.",
    );
  }

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14);

  const subscription = existing
    ? await db.subscription.update({
        where: { id: existing.id },
        data: {
          plan: "premium",
          status: "trialing",
          trialStart: now,
          trialEnd,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      })
    : await db.subscription.create({
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

  return { subscription, message: "Trial iniciado com sucesso" };
}

/**
 * Use Case: Cancel Subscription
 */
export async function cancelSubscriptionUseCase(studentId: string) {
  const subscription = await db.subscription.findUnique({
    where: { studentId },
  });
  if (!subscription) throw new Error("Assinatura não encontrada");

  const canceled = await db.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "canceled",
      canceledAt: new Date(),
      cancelAtPeriodEnd: true,
    },
  });

  return {
    subscription: canceled,
    message: "Assinatura cancelada com sucesso",
  };
}

/**
 * Use Case: Activate Premium
 */
export async function activatePremiumUseCase(
  studentId: string,
  billingPeriod: string = "monthly",
) {
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingPeriod === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const existing = await db.subscription.findUnique({ where: { studentId } });

  const subscription = existing
    ? await db.subscription.update({
        where: { id: existing.id },
        data: {
          plan: "premium",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      })
    : await db.subscription.create({
        data: {
          studentId,
          plan: "premium",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });

  return { subscription, message: "Premium ativado com sucesso" };
}
