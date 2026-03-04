import type { Context } from "elysia";
import { createGymSubscriptionSchema } from "@/lib/api/schemas";
import {
  GYM_PLANS_CONFIG,
  centsToReais,
} from "@/lib/access-control/plans-config";
import { db } from "@/lib/db";
import { ReferralService } from "@/lib/services/referral.service";
import { createGymSubscriptionPix } from "@/lib/utils/subscription";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";

type GymSubscriptionContext = {
  set: Context["set"];
  body?: Record<string, string | number | boolean | object | null>;
  userId: string;
};

async function getActiveGymId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { activeGymId: true },
  });

  return user?.activeGymId || null;
}

export async function getCurrentGymSubscriptionHandler({
  set,
  userId,
}: GymSubscriptionContext) {
  try {
    const gymId = await getActiveGymId(userId);
    if (!gymId) {
      return successResponse(set, { subscription: null });
    }

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    if (!subscription) {
      return successResponse(set, { subscription: null, isFirstPayment: true });
    }

    const now = new Date();
    const trialEndDate = subscription.trialEnd
      ? new Date(subscription.trialEnd)
      : null;
    const isTrialActive = trialEndDate ? trialEndDate > now : false;

    if (subscription.status === "canceled" && !isTrialActive) {
      return successResponse(set, { subscription: null });
    }

    // Primeira vez = nunca pagou (trial não conta; status active = já pagou)
    const isFirstPayment = subscription.status !== "active";

    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    return successResponse(set, {
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        basePrice: subscription.basePrice,
        pricePerStudent: subscription.pricePerStudent,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        isTrial: subscription.trialEnd
          ? new Date() < subscription.trialEnd
          : false,
        daysRemaining: subscription.trialEnd
          ? Math.max(
              0,
              Math.ceil(
                (subscription.trialEnd.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : null,
        activeStudents,
        billingPeriod:
          (subscription.billingPeriod as "monthly" | "annual" | null) ||
          "monthly",
        totalAmount:
          (subscription.billingPeriod || "monthly") === "annual"
            ? subscription.basePrice
            : subscription.basePrice +
              subscription.pricePerStudent * activeStudents,
        isFirstPayment,
      },
    });
  } catch (error) {
    console.error("[getCurrentGymSubscriptionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar assinatura", error);
  }
}

export async function createGymSubscriptionHandler({
  set,
  body,
  userId,
}: GymSubscriptionContext) {
  try {
    let gymId = await getActiveGymId(userId);
    if (!gymId) {
      const existingGym = await db.gym.findFirst({ where: { userId } });
      if (existingGym) {
        gymId = existingGym.id;
      } else {
        const newGym = await db.gym.create({
          data: {
            userId,
            name: "",
            address: "",
            phone: "",
            email: "",
            plan: "basic",
          },
        });
        gymId = newGym.id;
      }
    }

    if (!gymId) {
      return notFoundResponse(set, "Academia não encontrada");
    }

    const validation = validateBody(body ?? {}, createGymSubscriptionSchema);
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

    const { plan, billingPeriod = "monthly", referralCode } = validation.data;
    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    const now = new Date();
    const planKey = plan.toUpperCase() as keyof typeof GYM_PLANS_CONFIG;
    const config = GYM_PLANS_CONFIG[planKey];

    if (!config) {
      return badRequestResponse(set, "Plano inválido");
    }

    const basePrice = centsToReais(
      config.prices[billingPeriod as "monthly" | "annual"],
    );
    const pricePerStudent =
      billingPeriod === "annual" ? 0 : centsToReais(config.pricePerStudent);
    const pricePerPersonal = config.pricePerPersonal
      ? centsToReais(config.pricePerPersonal)
      : null;

    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const subscriptionToUseId = existingSubscription?.id || `new-${Date.now()}`;

    const pix = await createGymSubscriptionPix(
      gymId,
      plan,
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
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
          abacatePayBillingId: pix.id,
        },
      });
    } else {
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

    if (referralCode) {
      try {
        const normalized = referralCode.startsWith("@") ? referralCode : `@${referralCode}`;
        await ReferralService.resolveReferral(normalized, "GYM", gymId);
      } catch {
        /* silencioso */
      }
    }

    return successResponse(set, {
      pixId: pix.id,
      brCode: pix.brCode,
      brCodeBase64: pix.brCodeBase64,
      amount: pix.amount,
    });
  } catch (error) {
    console.error("[createGymSubscriptionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao criar assinatura", error);
  }
}

export async function startGymTrialHandler({
  set,
  userId,
}: GymSubscriptionContext) {
  try {
    const gymId = await getActiveGymId(userId);
    if (!gymId) {
      return badRequestResponse(set, "Academia não encontrada");
    }

    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    const now = new Date();
    if (existingSubscription) {
      // Não apagar nem reativar como trial quando já existe assinatura (ativa, trial ou cancelada).
      // Evita que "cancelar" vire trial e preserva restauração automática (canceledBecausePrincipalCanceled).
      return badRequestResponse(
        set,
        existingSubscription.status === "canceled"
          ? "Esta academia já possui uma assinatura cancelada. Renove o plano em vez de iniciar um novo trial."
          : "Assinatura já existe",
      );
    }

    const _activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const prices = {
      base: centsToReais(GYM_PLANS_CONFIG.BASIC.prices.monthly),
      perStudent: centsToReais(GYM_PLANS_CONFIG.BASIC.pricePerStudent),
    };

    const subscription = await db.gymSubscription.create({
      data: {
        gymId,
        plan: "basic",
        billingPeriod: "monthly",
        status: "trialing",
        basePrice: prices.base,
        pricePerStudent: prices.perStudent,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
      },
    });

    return successResponse(set, { subscription });
  } catch (error) {
    console.error("[startGymTrialHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao iniciar trial", error);
  }
}

export async function cancelGymSubscriptionHandler({
  set,
  userId,
}: GymSubscriptionContext) {
  try {
    const gymId = await getActiveGymId(userId);
    if (!gymId) {
      return notFoundResponse(set, "Academia não encontrada");
    }

    const subscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });
    if (!subscription) {
      return notFoundResponse(set, "Assinatura não encontrada");
    }

    await db.gymSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });

    return successResponse(set, {
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error) {
    console.error("[cancelGymSubscriptionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao cancelar assinatura", error);
  }
}
