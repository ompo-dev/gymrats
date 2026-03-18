import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";

export const GET = createSafeHandler(
  async ({ gymContext, req }) => {
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const stats = await GymInventoryService.getStats(gymContext?.gymId, {
      fresh,
    });
    return NextResponse.json({ stats });
  },
  {
    auth: "gym",
  },
);
