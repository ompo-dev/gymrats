/**
 * API Route para Ativar Premium Automaticamente
 * 
 * ATENÇÃO: Esta é uma rota temporária para desenvolvimento/testes.
 * Em produção, remover esta rota e usar o fluxo de billing real.
 * 
 * Ativa premium sem criar billing ou redirecionamento.
 * Apenas atualiza a subscription para premium ativo.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api/middleware/auth.middleware";
import {
  successResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api/utils/response.utils";

export async function POST(request: NextRequest) {
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

    // Buscar body para pegar billingPeriod (monthly ou annual)
    const body = await request.json().catch(() => ({}));
    const billingPeriod = body.billingPeriod || "monthly";

    // Verificar se existe subscription
    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingPeriod === "annual") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    let subscription;

    if (existingSubscription) {
      // Atualizar subscription existente
      subscription = await db.subscription.update({
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
    } else {
      // Criar nova subscription
      subscription = await db.subscription.create({
        data: {
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
    }

    return successResponse({
      subscription,
      message: "Premium ativado com sucesso",
    });
  } catch (error: any) {
    console.error("[activatePremiumHandler] Erro:", error);
    return internalErrorResponse("Erro ao ativar premium", error);
  }
}
