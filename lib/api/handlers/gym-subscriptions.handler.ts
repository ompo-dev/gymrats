/**
 * Handler de Gym Subscriptions
 *
 * Centraliza toda a lógica das rotas relacionadas a subscriptions de gyms
 */

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getGymSubscription, startGymTrial } from "@/app/gym/actions";
import { db } from "@/lib/db";
import { ReferralService } from "@/lib/services/referral.service";
import {
  centsToReais,
  getGymPlanConfig,
} from "@/lib/access-control/plans-config";
import { createGymSubscriptionPix } from "@/lib/utils/subscription";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createGymSubscriptionSchema } from "../schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response.utils";

/**
 * GET /api/gym-subscriptions/current
 * Busca assinatura atual da gym
 */
export async function getCurrentGymSubscriptionHandler(
  _request: NextRequest,
): Promise<NextResponse> {
  try {
    const subscription = await getGymSubscription();

    if (subscription) {
      console.log("[API] Gym Subscription retornada:", {
        id: subscription.id,
        plan: subscription.plan,
        billingPeriod: subscription.billingPeriod,
        status: subscription.status,
      });
    }

    return successResponse({ subscription });
  } catch (error) {
    console.error("[getCurrentGymSubscriptionHandler] Erro:", error);
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
    const pricePerPersonal = config.pricePerPersonal
      ? centsToReais(config.pricePerPersonal)
      : null;

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

    return successResponse({
      pixId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      amount: pix.amount,
    });
  } catch (error) {
    console.error("[createGymSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao criar assinatura", error);
  }
}

/**
 * POST /api/gym-subscriptions/start-trial
 * Inicia trial para gym
 */
export async function startGymTrialHandler(
  _request: NextRequest,
): Promise<NextResponse> {
  try {
    const result = await startGymTrial();

    if (result.error) {
      return badRequestResponse(result.error);
    }

    return successResponse({
      subscription: (result as { subscription: object }).subscription,
    });
  } catch (error) {
    console.error("[startGymTrialHandler] Erro:", error);
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

    return successResponse({
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error) {
    console.error("[cancelGymSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao cancelar assinatura", error);
  }
}
