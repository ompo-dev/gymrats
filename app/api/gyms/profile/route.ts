import { NextResponse } from "next/server";
import { updateGymProfileSchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { GymDomainService } from "@/lib/services/gym-domain.service";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const profile = await GymInventoryService.getProfile(gymContext?.gymId);
    return NextResponse.json({
      hasProfile: !!profile,
      profile,
    });
  },
  { auth: "gym" },
);

export const PATCH = createSafeHandler(
  async ({ gymContext, body }) => {
    const gymId = gymContext?.gymId;
    await GymDomainService.updateGymProfile(gymId, body);
    const profile = await GymInventoryService.getProfile(gymId);
    return NextResponse.json({ profile });
  },
  {
    auth: "gym",
    schema: { body: updateGymProfileSchema },
  },
);
