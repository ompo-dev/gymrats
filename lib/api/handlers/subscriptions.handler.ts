/**
 * Handler de Subscriptions (Student)
 * 
 * Centraliza toda a lógica das rotas relacionadas a subscriptions de students
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "../middleware/auth.middleware";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
} from "../utils/response.utils";
import { getStudentSubscription } from "@/app/student/actions";
import { createStudentSubscriptionBilling } from "@/lib/utils/subscription";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";

/**
 * GET /api/subscriptions/current
 * Busca assinatura atual do student
 */
export async function getCurrentSubscriptionHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const subscription = await getStudentSubscription();
    return successResponse({ subscription });
  } catch (error: any) {
    console.error("[getCurrentSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar assinatura", error);
  }
}

/**
 * POST /api/subscriptions/create
 * Cria uma nova assinatura
 */
export async function createSubscriptionHandler(
  request: NextRequest
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

    const { plan } = await request.json();

    if (!plan || (plan !== "monthly" && plan !== "annual")) {
      return badRequestResponse("Plano inválido");
    }

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

    // Se existe subscription, atualizar
    if (existingSubscription) {
      await db.subscription.update({
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
      });
    }

    const billing = await createStudentSubscriptionBilling(studentId, plan);

    if (!billing || !billing.id) {
      throw new Error("Erro ao criar cobrança: resposta inválida da AbacatePay");
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
  } catch (error: any) {
    console.error("[createSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao criar assinatura", error);
  }
}

/**
 * POST /api/subscriptions/start-trial
 * Inicia trial de 14 dias
 */
export async function startTrialHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;
    let studentId: string | null = null;

    if (auth.user.student?.id) {
      studentId = auth.user.student.id;
    } else {
      return notFoundResponse("Aluno não encontrado");
    }

    // Inicializar trial
    await initializeStudentTrial(studentId);

    return successResponse({ message: "Trial iniciado com sucesso" });
  } catch (error: any) {
    console.error("[startTrialHandler] Erro:", error);
    return internalErrorResponse("Erro ao iniciar trial", error);
  }
}

/**
 * POST /api/subscriptions/cancel
 * Cancela assinatura
 */
export async function cancelSubscriptionHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;
    let studentId: string | null = null;

    if (auth.user.student?.id) {
      studentId = auth.user.student.id;
    } else {
      return notFoundResponse("Aluno não encontrado");
    }

    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription) {
      return notFoundResponse("Assinatura não encontrada");
    }

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    return successResponse({ message: "Assinatura cancelada com sucesso" });
  } catch (error: any) {
    console.error("[cancelSubscriptionHandler] Erro:", error);
    return internalErrorResponse("Erro ao cancelar assinatura", error);
  }
}

