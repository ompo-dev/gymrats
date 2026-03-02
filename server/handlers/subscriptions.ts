import type { Context } from "elysia";
import {
  createSubscriptionSchema,
  startTrialSchema,
} from "@/lib/api/schemas/subscriptions.schemas";
import {
  activatePremiumUseCase,
  cancelSubscriptionUseCase,
  createSubscriptionUseCase,
  getCurrentSubscriptionUseCase,
  startTrialUseCase,
} from "@/lib/use-cases/subscriptions";
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
    return successResponse(set, result);
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

    const { plan } = validation.data;
    const result = await createSubscriptionUseCase({
      studentId,
      plan: plan as "monthly" | "annual",
    });
    return successResponse(set, result);
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
