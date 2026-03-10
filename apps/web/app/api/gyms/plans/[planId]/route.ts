import { NextResponse } from "next/server";
import {
  gymPlanIdParamsSchema,
  updateGymPlanSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

export const PATCH = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const plan = await GymDomainService.updatePlan(
      gymContext?.gymId,
      params.planId,
      body,
    );
    return NextResponse.json({ plan });
  },
  {
    auth: "gym",
    schema: {
      params: gymPlanIdParamsSchema,
      body: updateGymPlanSchema,
    },
  },
);

export const DELETE = createSafeHandler(
  async ({ gymContext, params }) => {
    await GymDomainService.deactivatePlan(gymContext?.gymId, params.planId);
    return NextResponse.json({ success: true });
  },
  {
    auth: "gym",
    schema: { params: gymPlanIdParamsSchema },
  },
);
