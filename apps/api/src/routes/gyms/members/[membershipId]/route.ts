import { NextResponse } from "@/runtime/next-server";
import {
  gymMembershipIdParamsSchema,
  updateGymMemberSchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

export const PATCH = createSafeHandler(
  async ({ gymContext, params, body }) => {
    const membership = await GymDomainService.updateMember(
      gymContext?.gymId,
      params.membershipId,
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
    await GymDomainService.cancelMember(gymContext?.gymId, params.membershipId);
    return NextResponse.json({ success: true });
  },
  {
    auth: "gym",
    schema: { params: gymMembershipIdParamsSchema },
  },
);
