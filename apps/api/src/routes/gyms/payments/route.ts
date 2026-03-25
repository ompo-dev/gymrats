import {
  createGymPaymentSchema,
  gymPaymentsQuerySchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

// GET — listar pagamentos
export const GET = createSafeHandler(
  async ({ query, gymContext, req }) => {
    const { gymId } = gymContext!;
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const payments = await GymDomainService.getPayments(gymId, {
      ...(query as Record<string, string | undefined>),
      fresh,
    });
    return NextResponse.json({ payments });
  },
  {
    auth: "gym",
    schema: { query: gymPaymentsQuerySchema },
  },
);

// POST — criar novo pagamento (avulso ou de mensalidade)
export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    const payment = await GymDomainService.createPayment(gymId, body);
    return NextResponse.json({ payment }, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: createGymPaymentSchema },
  },
);
