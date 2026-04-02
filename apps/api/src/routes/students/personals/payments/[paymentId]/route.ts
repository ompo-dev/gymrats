import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  paymentId: z.string().cuid("paymentId deve ser um CUID valido"),
});

/**
 * GET /api/students/personals/payments/[paymentId]
 * Retorna o status do pagamento para polling do modal PIX.
 */
export const GET = createSafeHandler(
  async ({ studentContext, params }) => {
    const { paymentId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;

    if (!studentId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const payment = await db.personalStudentPayment.findFirst({
      where: { id: paymentId, studentId },
      select: { id: true, status: true, assignmentId: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: payment.status,
      assignmentId: payment.assignmentId,
    });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
