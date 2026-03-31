import {
  gymPlanIdParamsSchema,
  updateGymPlanSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

export const PATCH = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const gymId = gymContext?.gymId;
    const planId = params?.planId;
    if (!gymId || !planId) {
      return NextResponse.json(
        { error: "Contexto do plano invalido" },
        { status: 400 },
      );
    }

    const plan = await GymDomainService.updatePlan(gymId, planId, body);
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
    const gymId = gymContext?.gymId;
    const planId = params?.planId;
    if (!gymId || !planId) {
      return NextResponse.json(
        { error: "Contexto do plano invalido" },
        { status: 400 },
      );
    }

    await GymDomainService.deactivatePlan(gymId, planId);
    return NextResponse.json({ success: true });
  },
  {
    auth: "gym",
    schema: { params: gymPlanIdParamsSchema },
  },
);
