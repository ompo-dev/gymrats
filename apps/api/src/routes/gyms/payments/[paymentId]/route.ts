import {
  gymPaymentIdParamsSchema,
  updateGymPaymentStatusSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
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

    const payment = await GymDomainService.updatePaymentStatus(
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
