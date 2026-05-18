import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  paymentId: z.string().cuid(),
});

const patchBodySchema = z.object({
  status: z.literal("canceled"),
});

/**
 * GET /api/payments/[paymentId]
 * Retorna o status de um pagamento especifico (para poll do modal PIX).
 * Auth: student (deve ser dono do pagamento).
 */
export const GET = createSafeHandler(
  async ({ studentContext, params }) => {
    const { paymentId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;

    const payment = await db.payment.findFirst({
      where: { id: paymentId, studentId },
      select: { id: true, status: true, withdrawnAt: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento nao encontrado" },
        { status: 404 },
      );
    }

    const status =
      payment.withdrawnAt !== null
        ? "withdrawn"
        : (payment.status as "paid" | "pending" | "overdue" | "canceled");

    return NextResponse.json({ id: payment.id, status });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);

/**
 * PATCH /api/payments/[paymentId]
 * Nao permite cancelamento de cobranca por aluno.
 * Auth: student (deve ser dono do pagamento). Mantido para contrato legado, mas retorna 409.
 */
export const PATCH = createSafeHandler(
  async ({ studentContext, params, body }) => {
    const { paymentId } = paramsSchema.parse(params);
    patchBodySchema.parse(body);
    const studentId = studentContext?.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const payment = await db.payment.findFirst({
      where: { id: paymentId, studentId },
      select: { id: true, status: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento nao encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Cancelamento de cobranca nao e permitido para aluno",
        code: "PAYMENT_CANCEL_NOT_ALLOWED",
        details: {
          paymentId,
          currentStatus: payment.status,
        },
      },
      { status: 409 },
    );
  },
  {
    auth: "student",
    schema: { params: paramsSchema, body: patchBodySchema },
  },
);
