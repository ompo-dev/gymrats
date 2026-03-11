import type { Context } from "elysia";
import {
  createSubscriptionSchema,
  startTrialSchema,
} from "@/lib/api/schemas/subscriptions.schemas";
import {
  activatePremiumUseCase,
  cancelSubscriptionUseCase,
  getCurrentSubscriptionUseCase,
  startTrialUseCase,
} from "@/lib/use-cases/subscriptions";
import { ReferralService } from "@/lib/services/referral.service";
import { createStudentSubscriptionPix } from "@/lib/utils/subscription";
import { db } from "@/lib/db";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";

type SubscriptionContext = {
  set: Context["set"];
  body?: Record<string, string | number | boolean | object | null>;
  studentId: string;
  userId: string;
};

export async function getCurrentSubscriptionHandler({
  set,
  studentId,
}: SubscriptionContext) {
  try {
    const result = await getCurrentSubscriptionUseCase(studentId);
    const sub = result.subscription;
    // Primeira vez = nunca pagou (trial não conta; status active de pagamento próprio = já pagou)
    const isFirstPayment = !sub || sub.status !== "active" || (sub as { source?: string }).source === "GYM_ENTERPRISE";
    return successResponse(set, { ...result, isFirstPayment });
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
    const validation = validateBody(body ?? {}, createSubscriptionSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors } as Record<
          string,
          string | number | boolean | object | null
        >,
      );
    }

    const { plan, referralCode } = validation.data;

    if (referralCode) {
      try {
        const normalized = referralCode.startsWith("@") ? referralCode : `@${referralCode}`;
        await ReferralService.resolveReferral(normalized, "STUDENT", studentId);
      } catch {
        /* silencioso */
      }
    }

    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    if (plan === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    let subscriptionId: string;
    const planLabel = plan === "annual" ? "Premium Anual" : "Premium Mensal";

    if (existingSubscription) {
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: planLabel,
          billingPeriod: plan,
          status: "pending_payment",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
      subscriptionId = existingSubscription.id;
    } else {
      const created = await db.subscription.create({
        data: {
          studentId,
          plan: planLabel,
          billingPeriod: plan,
          status: "pending_payment",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
      subscriptionId = created.id;
    }
    const pix = await createStudentSubscriptionPix(
      studentId,
      "premium",
      plan,
      subscriptionId,
      { referralCode: referralCode || null },
    );

    if (!pix || !pix.brCode) {
      throw new Error("Erro ao criar cobrança PIX: resposta inválida da AbacatePay");
    }

    await db.subscription.update({
      where: { id: subscriptionId },
      data: { abacatePayBillingId: pix.id },
    });

    return successResponse(set, {
      pixId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      amount: pix.amount,
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
    const validation = validateBody(body ?? {}, startTrialSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors } as Record<
          string,
          string | number | boolean | object | null
        >,
      );
    }

    try {
      const result = await startTrialUseCase(studentId);
      return successResponse(set, result);
    } catch (err) {
      return badRequestResponse(set, (err as Error).message);
    }
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
    try {
      const result = await cancelSubscriptionUseCase(studentId);
      console.log(
        `[Elysia][cancelSubscriptionHandler] Status: ${result.subscription.status}`,
      );
      return successResponse(set, result);
    } catch (err) {
      if ((err as Error).message === "Assinatura não encontrada")
        return notFoundResponse(set, "Assinatura não encontrada");
      throw err;
    }
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
    const billingPeriod =
      (body as { billingPeriod?: string })?.billingPeriod ?? "monthly";
    const result = await activatePremiumUseCase(studentId, billingPeriod);
    return successResponse(set, result);
  } catch (error) {
    console.error("[activatePremiumHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao ativar premium", error);
  }
}
