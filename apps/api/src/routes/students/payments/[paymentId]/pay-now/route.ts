import { DomainError, isDomainError } from "@gymrats/domain";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { persistBusinessEvent } from "@/lib/observability";
import { createPixForPendingPayment } from "@/lib/services/gym/gym-membership-payment.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  paymentId: z.string().cuid("paymentId deve ser um CUID valido"),
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
      const status = isDomainError(err) ? err.status : 500;
      const reasonMessage =
        err instanceof Error ? err.message : "Erro ao gerar PIX";

      await persistBusinessEvent({
        eventType: "pix.generated",
        domain: "payments",
        actorId: studentId,
        status: "failure",
        payload: {
          paymentId,
          reasonCode: isDomainError(err)
            ? err.code
            : "PAYMENT_PIX_GENERATION_FAILED",
          reasonMessage,
          errorType: status >= 500 ? "infra_or_provider" : "domain",
          status,
        },
      });

      if (isDomainError(err)) {
        throw err;
      }

      throw new DomainError({
        status: 500,
        code: "PAYMENT_PIX_GENERATION_FAILED",
        message: "Falha inesperada ao gerar PIX",
        details: {
          paymentId,
          studentId,
        },
      });
    }
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
