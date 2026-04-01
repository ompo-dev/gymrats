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
      return NextResponse.json(
        { error: "Contexto do pagamento invalido" },
        { status: 400 },
      );
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
