import { NextResponse } from "@/runtime/next-server";
import {
  createGymPlanSchema,
  gymPlansQuerySchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

// GET — listar planos da academia
export const GET = createSafeHandler(
  async ({ query, gymContext }) => {
    const { gymId } = gymContext!;
    const plans = await GymDomainService.getPlans(gymId, query);
    return NextResponse.json({ plans });
  },
  {
    auth: "gym",
    schema: { query: gymPlansQuerySchema },
  },
);

// POST — criar novo plano
export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    const plan = await GymDomainService.createPlan(gymId, body);
    return NextResponse.json({ plan }, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: createGymPlanSchema },
  },
);
