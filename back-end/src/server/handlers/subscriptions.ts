import { db } from "@/lib/db";
import type { Context } from "elysia";
import { startTrialSchema, createSubscriptionSchema } from "@gymrats/contracts";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";

type SubscriptionContext = {
  set: Context["set"];
  body?: unknown;
  studentId: string;
  userId: string;
};

export async function getCurrentSubscriptionHandler({
  set,
  studentId,
}: SubscriptionContext) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });
    return successResponse(set, { subscription: subscription || null });
  } catch (error) {
    console.error("[getCurrentSubscriptionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar assinatura", error);
  }
}

export async function createSubscriptionHandler({
  set,
  body,
  studentId,
}: SubscriptionContext) {
  try {
    const validation = validateBody(body, createSubscriptionSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const data = validation.data as any;
    const now = new Date();
    const periodEnd = new Date(now);
    if (data.billingPeriod === "annual") {
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

    return successResponse(set, {
      subscription,
      message: "Assinatura criada com sucesso",
    });
  } catch (error) {
    console.error("[createSubscriptionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao criar assinatura", error);
  }
}

export async function startTrialHandler({
  set,
  body,
  studentId,
}: SubscriptionContext) {
  try {
    const validation = validateBody(body, startTrialSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.subscription.upsert({
      where: { studentId },
      update: {
        plan: "premium",
        status: "trialing",
        trialStart: now,
        trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      },
      create: {
        studentId,
        plan: "premium",
        status: "trialing",
        trialStart: now,
        trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      },
    });

    return successResponse(set, {
      subscription,
      message: "Trial iniciado com sucesso",
    });
  } catch (error) {
    console.error("[startTrialHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao iniciar trial", error);
  }
}

export async function cancelSubscriptionHandler({
  set,
  studentId,
}: SubscriptionContext) {
  try {
    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription) {
      return notFoundResponse(set, "Assinatura não encontrada");
    }

    const canceled = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });

    return successResponse(set, {
      subscription: canceled,
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error) {
    console.error("[cancelSubscriptionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao cancelar assinatura", error);
  }
}

export async function activatePremiumHandler({
  set,
  body,
  studentId,
}: SubscriptionContext) {
  try {
    const billingPeriod = (body as any)?.billingPeriod || "monthly";
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    const subscription = existingSubscription
      ? await db.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            plan: "premium",
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            trialStart: null,
            trialEnd: null,
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
          },
        });

    return successResponse(set, {
      subscription,
      message: "Assinatura ativada com sucesso",
    });
  } catch (error) {
    console.error("[activatePremiumHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao ativar assinatura", error);
  }
}
