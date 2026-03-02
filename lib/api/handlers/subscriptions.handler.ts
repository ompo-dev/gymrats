/**
 * Handler de Subscriptions (Student)
 *
 * Centraliza toda a lógica das rotas relacionadas a subscriptions de students
 */

import type { NextRequest, NextResponse } from "next/server";
import { getStudentSubscription } from "@/app/student/actions";
import { db } from "@/lib/db";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import { createStudentSubscriptionBilling } from "@/lib/utils/subscription";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { createSubscriptionSchema } from "../schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response.utils";

/**
 * GET /api/subscriptions/current
 * Busca assinatura atual do student
 */
export async function getCurrentSubscriptionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    // Validar autenticação primeiro
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const subscription = await getStudentSubscription();
    return successResponse({ subscription });
  } catch (error) {
    console.error("[getCurrentSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar assinatura", error);
  }
}

/**
 * POST /api/subscriptions/create
 * Cria uma nova assinatura
 */
export async function createSubscriptionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    // Se for ADMIN, garantir que tenha perfil de student
    let studentId: string | null = null;
    if (auth.user.role === "ADMIN") {
      const existingStudent = await db.student.findUnique({
        where: { userId: userId },
      });

      if (!existingStudent) {
        const newStudent = await db.student.create({
          data: {
            userId: userId,
          },
        });
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }
    } else if (auth.user.student?.id) {
      studentId = auth.user.student.id;
    }

    if (!studentId) {
      return notFoundResponse("Aluno não encontrado");
    }

    // Validar body com Zod
    const validation = await validateBody(request, createSubscriptionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { plan } = validation.data;

    // Verificar se existe subscription
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

    // Se existe subscription, atualizar (não limpar trialStart/trialEnd: trial só uma vez)
    if (existingSubscription) {
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: `Premium ${plan === "annual" ? "Anual" : "Mensal"}`,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    const billing = await createStudentSubscriptionBilling(studentId, plan);

    if (!billing || !billing.id) {
      throw new Error(
        "Erro ao criar cobrança: resposta inválida da AbacatePay",
      );
    }

    // Atualizar subscription com billingId
    if (existingSubscription) {
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          abacatePayBillingId: billing.id,
        },
      });
    }

    return successResponse({
      billingUrl: String(billing.url || ""),
      billingId: String(billing.id || ""),
    });
  } catch (error) {
    console.error("[createSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao criar assinatura", error);
  }
}

/**
 * POST /api/subscriptions/start-trial
 * Inicia trial de 14 dias
 */
export async function startTrialHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const _userId = auth.userId;
    let studentId: string | null = null;

    if (auth.user.student?.id) {
      studentId = auth.user.student.id;
    } else {
      return notFoundResponse("Aluno não encontrado");
    }

    const result = await initializeStudentTrial(studentId!);
    if (!result) {
      return internalErrorResponse("Erro ao iniciar trial", undefined);
    }
    if (!result.success) {
      const message =
        result.reason === "already_used_trial"
          ? "Você já utilizou o trial anteriormente. Trial só pode ser ativado uma vez."
          : "Você já possui uma assinatura. Renove ou escolha um plano para continuar.";
      return badRequestResponse(message);
    }

    return successResponse({ message: "Trial iniciado com sucesso" });
  } catch (error) {
    console.error("[startTrialHandler] Erro:", error);
    return internalErrorResponse("Erro ao iniciar trial", error);
  }
}

/**
 * POST /api/subscriptions/cancel
 * Cancela assinatura
 */
export async function cancelSubscriptionHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const _userId = auth.userId;
    let studentId: string | null = null;

    if (auth.user.student?.id) {
      studentId = auth.user.student.id;
    } else {
      return notFoundResponse("Aluno não encontrado");
    }

    const subscription = await db.subscription.findUnique({
      where: { studentId: studentId! },
    });

    if (!subscription) {
      return notFoundResponse("Assinatura não encontrada");
    }

    console.log(
      `[cancelSubscriptionHandler] Student ${studentId} cancelando sub ${subscription.id}`,
    );

    const canceled = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    console.log(
      `[cancelSubscriptionHandler] Sucesso. Novo status: ${canceled.status}`,
    );

    return successResponse({
      subscription: canceled,
      message: "Assinatura cancelada com sucesso",
    });
  } catch (error) {
    console.error("[cancelSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao cancelar assinatura", error);
  }
}
