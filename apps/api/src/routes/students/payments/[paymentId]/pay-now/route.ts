import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { persistBusinessEvent } from "@/lib/observability";
import { createPixForPendingPayment } from "@/lib/services/gym/gym-membership-payment.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  paymentId: z.string().min(1),
});

/**
 * POST /api/students/payments/[paymentId]/pay-now
 * Gera novo PIX para pagamento pendente (para "Pagar agora").
 * Auth: student (deve ser dono do pagamento).
 */
export const POST = createSafeHandler(
  async ({ studentContext, params }) => {
    const { paymentId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;
    if (!studentId)
      return NextResponse.json(
        { error: "Estudante não autenticado" },
        { status: 401 },
      );

    try {
      const result = await createPixForPendingPayment(paymentId, studentId);
      await persistBusinessEvent({
        eventType: "pix.generated",
        domain: "payments",
        actorId: studentId,
        status: "success",
        payload: {
          paymentId: result.paymentId,
          amount: result.amount,
          expiresAt: result.expiresAt,
        },
      });
      return NextResponse.json({
        paymentId: result.paymentId,
        brCode: result.brCode,
        brCodeBase64: result.brCodeBase64,
        amount: result.amount,
        expiresAt: result.expiresAt,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar PIX";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
