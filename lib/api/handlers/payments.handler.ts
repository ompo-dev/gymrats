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
import {
  paymentsQuerySchema,
  addPaymentMethodSchema,
} from "../schemas";
import { validateBody, validateQuery } from "../middleware/validation.middleware";

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

    // Validar query params com Zod
    const queryValidation = await validateQuery(request, paymentsQuerySchema);
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const limit = queryValidation.data.limit || 20;
    const offset = queryValidation.data.offset || 0;

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

    // Validar body com Zod
    const validation = await validateBody(request, addPaymentMethodSchema);
    if (!validation.success) {
      return validation.response;
    }

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
    } = validation.data;

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

    // Buscar memberships (modelo é GymMembership no Prisma)
    const memberships = await db.gymMembership.findMany({
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
      endDate: membership.nextBillingDate || undefined, // GymMembership usa nextBillingDate, não endDate
      status: membership.status as "active" | "expired" | "canceled" | "suspended" | "pending",
      autoRenew: membership.autoRenew,
      amount: membership.amount,
    }));

    return successResponse({ memberships: formattedMemberships });
  } catch (error: any) {
    console.error("[getMembershipsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar memberships", error);
  }
}

