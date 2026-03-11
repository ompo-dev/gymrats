import { NextResponse } from "next/server";
import {
  createGymPaymentSchema,
  gymPaymentsQuerySchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

// GET — listar pagamentos
export const GET = createSafeHandler(
  async ({ query, gymContext }) => {
    const { gymId } = gymContext!;
    const payments = await GymDomainService.getPayments(gymId, query);
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
