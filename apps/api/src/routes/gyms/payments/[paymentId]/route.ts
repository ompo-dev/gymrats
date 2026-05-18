import { DomainError } from "@gymrats/domain";
import { GymAccessEligibilityService } from "@gymrats/domain/services/gym/gym-access-eligibility.service";
import {
  gymPaymentIdParamsSchema,
  updateGymPaymentStatusSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { NextResponse } from "@/runtime/next-server";

export const PATCH = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const gymId = gymContext?.gymId;
    const paymentId = params?.paymentId;
    if (!gymId || !paymentId) {
      throw new DomainError({
        status: 400,
        code: "PAYMENT_CONTEXT_INVALID",
        message: "Contexto do pagamento inválido",
      });
    }

    if (body.status === "paid") {
      throw new DomainError({
        status: 409,
        code: "PAYMENT_STATUS_REQUIRES_SETTLEMENT",
        message:
          "Liquidação deve ser feita via /api/gyms/payments/[paymentId]/settle",
        details: {
          paymentId,
          attemptedStatus: body.status,
        },
      });
    }

    const payment = await GymAccessEligibilityService.updatePaymentStatus(
      gymId,
      paymentId,
      body.status,
    );
    return NextResponse.json({ payment });
  },
  {
    auth: "gym",
    schema: {
      params: gymPaymentIdParamsSchema,
      body: updateGymPaymentStatusSchema,
    },
  },
);
