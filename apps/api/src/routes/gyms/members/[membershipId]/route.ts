import {
  gymMembershipIdParamsSchema,
  updateGymMemberSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

export const PATCH = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const gymId = gymContext?.gymId;
    const membershipId = params?.membershipId;
    if (!gymId || !membershipId) {
      return NextResponse.json(
        { error: "Contexto da matricula invalido" },
        { status: 400 },
      );
    }

    const membership = await GymDomainService.updateMember(
      gymId,
      membershipId,
      body,
    );
    return NextResponse.json({ success: true, membership });
  },
  {
    auth: "gym",
    schema: {
      params: gymMembershipIdParamsSchema,
      body: updateGymMemberSchema,
    },
  },
);

export const DELETE = createSafeHandler(
  async ({ gymContext, params }) => {
    const gymId = gymContext?.gymId;
    const membershipId = params?.membershipId;
    if (!gymId || !membershipId) {
      return NextResponse.json(
        { error: "Contexto da matricula invalido" },
        { status: 400 },
      );
    }

    await GymDomainService.cancelMember(gymId, membershipId);
    return NextResponse.json({ success: true });
  },
  {
    auth: "gym",
    schema: { params: gymMembershipIdParamsSchema },
  },
);
