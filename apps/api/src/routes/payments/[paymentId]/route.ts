import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { persistBusinessEvent } from "@/lib/observability";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  paymentId: z.string().min(1),
});

const patchBodySchema = z.object({
  status: z.literal("canceled"),
});

/**
 * GET /api/payments/[paymentId]
 * Retorna o status de um pagamento específico (para poll do modal PIX).
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
        { error: "Pagamento não encontrado" },
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
 * Cancela um pagamento pendente (ex.: usuário fechou o modal PIX pelo X ou fora).
 * Auth: student (deve ser dono do pagamento). Só permite status "canceled" e apenas se o pagamento estiver pending/overdue.
 */
export const PATCH = createSafeHandler(
  async ({ studentContext, params, body }) => {
    const { paymentId } = paramsSchema.parse(params);
    patchBodySchema.parse(body);
    const studentId = studentContext?.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const payment = await db.payment.findFirst({
      where: { id: paymentId, studentId },
      select: { id: true, status: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    if (payment.status !== "pending" && payment.status !== "overdue") {
      return NextResponse.json(
        { error: "Só é possível cancelar pagamento pendente ou em atraso" },
        { status: 400 },
      );
    }

    await db.payment.update({
      where: { id: paymentId },
      data: { status: "canceled" },
    });

    await persistBusinessEvent({
      eventType: "payment.canceled",
      domain: "payments",
      actorId: studentId,
      status: "success",
      payload: {
        paymentId,
      },
    });

    return NextResponse.json({ ok: true });
  },
  {
    auth: "student",
    schema: { params: paramsSchema, body: patchBodySchema },
  },
);
