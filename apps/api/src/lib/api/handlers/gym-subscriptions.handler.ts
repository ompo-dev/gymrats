/**
 * Handler de Gym Subscriptions
 *
 * Centraliza toda a lógica das rotas relacionadas a subscriptions de gyms
 */

import {
  centsToReais,
  getGymPlanConfig,
} from "@/lib/access-control/plans-config";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { auditLog } from "@/lib/security/audit-log";
import { ReferralService } from "@/lib/services/referral.service";
import { createGymSubscriptionPix } from "@/lib/utils/subscription";
import type { NextRequest, NextResponse } from "@/runtime/next-server";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createGymSubscriptionSchema } from "../schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response.utils";

async function resolveGymIdForAuth(auth: {
  userId: string;
  user: {
    role?: string;
    gyms?: { id: string }[] | null;
  };
}): Promise<string | null> {
  if (auth.user.role === "ADMIN") {
    const existingGym = await db.gym.findFirst({
      where: { userId: auth.userId },
      select: { id: true },
    });

    return existingGym?.id ?? null;
  }

  if (auth.user.gyms && auth.user.gyms.length > 0) {
    return auth.user.gyms[0].id;
  }

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { activeGymId: true },
  });

  return user?.activeGymId ?? null;
}

/**
 * GET /api/gym-subscriptions/current
 * Busca assinatura atual da gym
 */
export async function getCurrentGymSubscriptionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const gymId = await resolveGymIdForAuth(auth);
    if (!gymId) {
      return successResponse({ subscription: null, isFirstPayment: true });
    }

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (subscription) {
      log.debug("[API] Gym Subscription retornada", {
        id: subscription.id,
        plan: subscription.plan,
        billingPeriod: subscription.billingPeriod,
        status: subscription.status,
      });
    }

    const activeStudents = gymId
      ? await db.gymMembership.count({
          where: { gymId, status: "active" },
        })
      : 0;
    const activePersonals = gymId
      ? await db.gymPersonalAffiliation.count({
          where: { gymId, status: "active" },
        })
      : 0;
    const billingPeriod =
      (subscription?.billingPeriod as "monthly" | "annual" | undefined) ??
      "monthly";
    const config = subscription ? getGymPlanConfig(subscription.plan) : null;
    const basePrice = config
      ? centsToReais(config.prices[billingPeriod])
      : subscription?.basePrice;
    const pricePerStudent = config
      ? billingPeriod === "annual"
        ? 0
        : centsToReais(config.pricePerStudent)
      : subscription?.pricePerStudent;
    const pricePerPersonal = config
      ? billingPeriod === "annual"
        ? 0
        : centsToReais(config.pricePerPersonal ?? 0)
      : (subscription?.pricePerPersonal ?? 0);
    const totalAmount =
      subscription == null
        ? 0
        : billingPeriod === "annual"
          ? (basePrice ?? 0)
          : (basePrice ?? 0) +
            (pricePerStudent ?? 0) * activeStudents +
            pricePerPersonal * activePersonals;

    const isTrialActive = subscription?.trialEnd
      ? new Date(subscription.trialEnd) > new Date()
      : false;
    const isFirstPayment = !subscription
      ? true
      : subscription.status === "canceled" && !isTrialActive
        ? false
        : subscription.status !== "active";

    return successResponse({
      subscription: subscription
        ? {
            ...subscription,
            billingPeriod,
            basePrice,
            pricePerStudent,
            pricePerPersonal,
            activeStudents,
            activePersonals,
            totalAmount,
          }
        : null,
      isFirstPayment,
    });
  } catch (error) {
    log.error("[getCurrentGymSubscriptionHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse("Erro ao buscar assinatura", error);
  }
}

/**
 * POST /api/gym-subscriptions/create
 * Cria uma nova assinatura para gym
 */
export async function createGymSubscriptionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    // Se for ADMIN, garantir que tenha perfil de gym
    let gymId: string | null = null;
    if (auth.user.role === "ADMIN") {
      const existingGym = await db.gym.findFirst({
        where: { userId: userId },
      });

      if (!existingGym) {
        const newGym = await db.gym.create({
          data: {
            userId: userId,
            name: String(auth.user.name || ""),
            address: "",
            phone: "",
            email: String(auth.user.email || ""),
            plan: "basic",
          },
        });
        gymId = newGym.id;
      } else {
        gymId = existingGym.id;
      }
    } else if (auth.user.gyms && auth.user.gyms.length > 0) {
      gymId = auth.user.gyms[0].id;
    }

    if (!gymId) {
      return notFoundResponse("Academia não encontrada");
    }

    // Validar body com Zod
    const validation = await validateBody(request, createGymSubscriptionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { plan, billingPeriod = "monthly", referralCode } = validation.data;

    const activeStudents = await db.gymMembership.count({
      where: {
        gymId,
        status: "active",
      },
    });

    // Verificar se existe subscription
    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    const now = new Date();
    const config = getGymPlanConfig(plan);
    if (!config) {
      return badRequestResponse("Plão inválido");
    }

    const basePrice = centsToReais(
      config.prices[billingPeriod as "monthly" | "annual"],
    );
    const pricePerStudent =
      billingPeriod === "annual" ? 0 : centsToReais(config.pricePerStudent);
    const pricePerPersonal =
      billingPeriod === "annual"
        ? 0
        : centsToReais(config.pricePerPersonal ?? 0);

    // Calcular período
    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const subscriptionToUseId = existingSubscription?.id || `new-${Date.now()}`;

    // Criar billing PIX AbacatePay primeiro (com 5% desconto se referralCode válido)
    const pix = await createGymSubscriptionPix(
      gymId,
      plan as "basic" | "premium" | "enterprise",
      activeStudents,
      billingPeriod,
      subscriptionToUseId,
      { referralCode: referralCode || null },
    );

    if (!pix || !pix.id) {
      throw new Error(
        "Erro ao criar cobrança PIX: resposta inválida da AbacatePay",
      );
    }

    // Atualizar ou criar subscription com status pending_payment
    // Não ativar aqui — o webhook é quem ativa após pagamento confirmado
    if (existingSubscription) {
      await db.gymSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan,
          billingPeriod,
          status: "pending_payment",
          basePrice,
          pricePerStudent,
          pricePerPersonal,
          canceledAt: null,
          cancelAtPeriodEnd: false,
          abacatePayBillingId: pix.id,
        },
      });
    } else {
      // Primeira assinatura (sem trial prévio)
      await db.gymSubscription.create({
        data: {
          gymId,
          plan,
          billingPeriod,
          status: "pending_payment",
          basePrice,
          pricePerStudent,
          pricePerPersonal,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          abacatePayBillingId: pix.id,
        },
      });
    }

    // Resolver referral de academia (se veio por link de indicação)
    if (referralCode) {
      try {
        const normalized = referralCode.startsWith("@")
          ? referralCode
          : `@${referralCode}`;
        await ReferralService.resolveReferral(normalized, "GYM", gymId);
      } catch {
        /* silencioso — não bloqueia a assinatura */
      }
    }

    await auditLog({
      action: "PAYMENT:INITIATED",
      actorId: auth.userId,
      targetId: existingSubscription?.id ?? gymId,
      request,
      result: "SUCCESS",
      payload: {
        domain: "gym-subscription",
        gymId,
        plan,
        billingPeriod,
        pixId: pix.id,
        amount: pix.amount,
        referralCodeApplied: Boolean(referralCode),
      },
    });

    return successResponse({
      pixId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      amount: pix.amount,
      expiresAt: pix.expiresAt,
    });
  } catch (error) {
    log.error("[createGymSubscriptionHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse("Erro ao criar assinatura", error);
  }
}

/**
 * POST /api/gym-subscriptions/start-trial
 * Inicia trial para gym
 */
export async function startGymTrialHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const gymId = await resolveGymIdForAuth(auth);
    if (!gymId) {
      return notFoundResponse("Academia não encontrada");
    }

    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (existingSubscription) {
      return badRequestResponse(
        existingSubscription.status === "canceled"
          ? "Esta academia já possui uma assinatura cancelada. Renove o plano em vez de iniciar um novo trial."
          : "Assinatura já existe",
      );
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.gymSubscription.create({
      data: {
        gymId,
        plan: "basic",
        billingPeriod: "monthly",
        status: "trialing",
        basePrice: centsToReais(getGymPlanConfig("basic")!.prices.monthly),
        pricePerStudent: centsToReais(
          getGymPlanConfig("basic")!.pricePerStudent,
        ),
        pricePerPersonal: centsToReais(
          getGymPlanConfig("basic")!.pricePerPersonal ?? 0,
        ),
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
      },
    });

    return successResponse({ subscription });
  } catch (error) {
    log.error("[startGymTrialHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse("Erro ao iniciar trial", error);
  }
}

/**
 * POST /api/gym-subscriptions/cancel
 * Cancela assinatura da gym
 */
export async function cancelGymSubscriptionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    // Se for ADMIN, garantir que tenha perfil de gym
    let gymId: string | null = null;
    if (auth.user.role === "ADMIN") {
      const existingGym = await db.gym.findFirst({
        where: { userId: userId },
      });

      if (!existingGym) {
        return notFoundResponse("Academia não encontrada");
      }
      gymId = existingGym.id;
    } else if (auth.user.gyms && auth.user.gyms.length > 0) {
      gymId = auth.user.gyms[0].id;
    }

    if (!gymId) {
      return notFoundResponse("Academia não encontrada");
    }

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (!subscription) {
      return notFoundResponse("Assinatura não encontrada");
    }

    await db.gymSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });

    await auditLog({
      action: "SUBSCRIPTION:CANCELLED",
      actorId: auth.userId,
      targetId: subscription.id,
      request,
      result: "SUCCESS",
      payload: {
        domain: "gym-subscription",
        gymId,
      },
    });

    return successResponse({
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error) {
    log.error("[cancelGymSubscriptionHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse("Erro ao cancelar assinatura", error);
  }
}
