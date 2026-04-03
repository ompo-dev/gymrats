import { gymPaymentIdParamsSchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

export const POST = createSafeHandler(
  async ({ gymContext, params }) => {
    const gymId = gymContext?.gymId;
    const paymentId = params?.paymentId;
    if (!gymId || !paymentId) {
      return NextResponse.json(
        { error: "Contexto do pagamento inválido" },
        { status: 400 },
      );
    }

    const payment = await GymDomainService.settlePayment(gymId, paymentId);
    return NextResponse.json({ payment });
  },
  {
    auth: "gym",
    schema: {
      params: gymPaymentIdParamsSchema,
    },
  },
);
