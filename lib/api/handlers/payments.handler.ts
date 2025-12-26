/**
 * Handler de Payments
 * 
 * Centraliza toda a lógica das rotas relacionadas a pagamentos
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireStudent } from "../middleware/auth.middleware";
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from "../utils/response.utils";

/**
 * GET /api/payments
 * Busca histórico de pagamentos
 */
export async function getPaymentsHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    // Ler query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Buscar pagamentos
    const payments = await db.payment.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transformar para formato esperado
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      gymId: payment.gymId,
      gymName: payment.gym.name,
      planName: payment.plan?.name || undefined,
      amount: payment.amount,
      date: payment.date,
      dueDate: payment.dueDate,
      status: payment.status as
        | "paid"
        | "pending"
        | "overdue"
        | "canceled",
      paymentMethod: payment.paymentMethod as
        | "credit-card"
        | "debit-card"
        | "pix"
        | "cash"
        | undefined,
      reference: payment.reference || undefined,
    }));

    // Contar total
    const total = await db.payment.count({
      where: {
        studentId: studentId,
      },
    });

    return successResponse({
      payments: formattedPayments,
      total: total,
      limit: limit,
      offset: offset,
    });
  } catch (error: any) {
    console.error("[getPaymentsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar pagamentos", error);
  }
}

/**
 * GET /api/payment-methods
 * Busca métodos de pagamento
 */
export async function getPaymentMethodsHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    // Buscar métodos de pagamento
    const paymentMethods = await db.paymentMethod.findMany({
      where: {
        userId: userId,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Transformar para formato esperado
    const formattedMethods = paymentMethods.map((method) => ({
      id: method.id,
      type: method.type as "credit-card" | "debit-card" | "pix",
      isDefault: method.isDefault,
      cardBrand: method.cardBrand || undefined,
      last4: method.last4 || undefined,
      expiryMonth: method.expiryMonth || undefined,
      expiryYear: method.expiryYear || undefined,
      holderName: method.holderName || undefined,
      pixKey: method.pixKey || undefined,
    }));

    return successResponse({ paymentMethods: formattedMethods });
  } catch (error: any) {
    console.error("[getPaymentMethodsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar métodos de pagamento", error);
  }
}

/**
 * POST /api/payment-methods
 * Adiciona método de pagamento
 */
export async function addPaymentMethodHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

    const body = await request.json();
    const {
      type,
      isDefault,
      cardBrand,
      last4,
      expiryMonth,
      expiryYear,
      holderName,
      pixKey,
      pixKeyType,
    } = body;

    // Validar dados
    if (!type || !["credit-card", "debit-card", "pix"].includes(type)) {
      return badRequestResponse("Tipo de pagamento inválido");
    }

    // Se for cartão, validar campos obrigatórios
    if (type === "credit-card" || type === "debit-card") {
      if (!last4 || !cardBrand) {
        return badRequestResponse("Campos obrigatórios faltando para cartão");
      }
    }

    // Se for PIX, validar campos obrigatórios
    if (type === "pix") {
      if (!pixKey || !pixKeyType) {
        return badRequestResponse("Campos obrigatórios faltando para PIX");
      }
    }

    // Se for marcado como padrão, desmarcar outros
    if (isDefault) {
      await db.paymentMethod.updateMany({
        where: {
          userId: userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Criar método de pagamento
    const paymentMethod = await db.paymentMethod.create({
      data: {
        userId: userId,
        type: type,
        isDefault: isDefault || false,
        cardBrand: cardBrand || null,
        last4: last4 || null,
        expiryMonth: expiryMonth || null,
        expiryYear: expiryYear || null,
        holderName: holderName || null,
        pixKey: pixKey || null,
        pixKeyType: pixKeyType || null,
      },
    });

    return successResponse({
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        isDefault: paymentMethod.isDefault,
        cardBrand: paymentMethod.cardBrand || undefined,
        last4: paymentMethod.last4 || undefined,
        expiryMonth: paymentMethod.expiryMonth || undefined,
        expiryYear: paymentMethod.expiryYear || undefined,
        holderName: paymentMethod.holderName || undefined,
        pixKey: paymentMethod.pixKey || undefined,
      },
    });
  } catch (error: any) {
    console.error("[addPaymentMethodHandler] Erro:", error);
    return internalErrorResponse("Erro ao criar método de pagamento", error);
  }
}

/**
 * GET /api/memberships
 * Busca memberships de academias
 */
export async function getMembershipsHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    // Buscar memberships
    const memberships = await db.membership.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            address: true,
            logo: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformar para formato esperado
    const formattedMemberships = memberships.map((membership) => ({
      id: membership.id,
      gymId: membership.gymId,
      gymName: membership.gym.name,
      planName: membership.plan?.name || undefined,
      startDate: membership.startDate,
      endDate: membership.endDate,
      status: membership.status as "active" | "expired" | "canceled",
      autoRenew: membership.autoRenew,
    }));

    return successResponse({ memberships: formattedMemberships });
  } catch (error: any) {
    console.error("[getMembershipsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar memberships", error);
  }
}

