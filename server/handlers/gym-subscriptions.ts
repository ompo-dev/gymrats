import { db } from "@/lib/db";
import type { Context } from "elysia";
import { createGymSubscriptionBilling } from "@/lib/utils/subscription";
import { createGymSubscriptionSchema } from "@/lib/api/schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";

type GymSubscriptionContext = {
  set: Context["set"];
  body?: unknown;
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
      return successResponse(set, { subscription: null });
    }

    const now = new Date();
    const trialEndDate = subscription.trialEnd
      ? new Date(subscription.trialEnd)
      : null;
    const isTrialActive = trialEndDate ? trialEndDate > now : false;

    if (subscription.status === "canceled" && !isTrialActive) {
      return successResponse(set, { subscription: null });
    }

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
        isTrial: subscription.trialEnd ? new Date() < subscription.trialEnd : false,
        daysRemaining: subscription.trialEnd
          ? Math.max(
              0,
              Math.ceil(
                (subscription.trialEnd.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : null,
        activeStudents,
        billingPeriod:
          (subscription.billingPeriod as "monthly" | "annual" | null) || "monthly",
        totalAmount:
          (subscription.billingPeriod || "monthly") === "annual"
            ? subscription.basePrice
            : subscription.basePrice + subscription.pricePerStudent * activeStudents,
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

    const validation = validateBody(body, createGymSubscriptionSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const { plan, billingPeriod = "monthly" } = validation.data as any;
    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    const existingSubscription = await db.gymSubscription.findUnique({
      where: { gymId },
    });

    const now = new Date();
    const planPrices = {
      basic: { base: 150, perStudent: 1.5 },
      premium: { base: 250, perStudent: 1 },
      enterprise: { base: 400, perStudent: 0.5 },
    };
    const prices = planPrices[plan as keyof typeof planPrices];

    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    if (existingSubscription) {
      await db.gymSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan,
          billingPeriod,
          status: "active",
          basePrice: prices.base,
          pricePerStudent: billingPeriod === "annual" ? 0 : prices.perStudent,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialStart: null,
          trialEnd: null,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    const billing = await createGymSubscriptionBilling(
      gymId,
      plan,
      activeStudents,
      billingPeriod
    );

    if (!billing || !billing.id) {
      throw new Error("Erro ao criar cobrança: resposta inválida da AbacatePay");
    }

    if (existingSubscription) {
      await db.gymSubscription.update({
        where: { id: existingSubscription.id },
        data: { abacatePayBillingId: billing.id },
      });
    }

    return successResponse(set, {
      billingUrl: String(billing.url || ""),
      billingId: String(billing.id || ""),
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
      const trialEndDate = existingSubscription.trialEnd
        ? new Date(existingSubscription.trialEnd)
        : null;
      const isTrialActive = trialEndDate ? trialEndDate > now : false;

      if (existingSubscription.status === "canceled" && !isTrialActive) {
        await db.gymSubscription.delete({
          where: { id: existingSubscription.id },
        });
      } else if (existingSubscription.status === "canceled" && isTrialActive) {
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14);

        const updatedSubscription = await db.gymSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "trialing",
            canceledAt: null,
            cancelAtPeriodEnd: false,
            trialStart: now,
            trialEnd,
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
          },
        });

        return successResponse(set, { subscription: updatedSubscription });
      } else {
        return badRequestResponse(set, "Assinatura já existe");
      }
    }

    const activeStudents = await db.gymMembership.count({
      where: { gymId, status: "active" },
    });

    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const prices = { base: 150, perStudent: 1.5 };

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

    const subscription = await db.gymSubscription.findUnique({ where: { gymId } });
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

    return successResponse(set, { message: "Assinatura cancelada com sucesso" });
  } catch (error) {
    console.error("[cancelGymSubscriptionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao cancelar assinatura", error);
  }
}
