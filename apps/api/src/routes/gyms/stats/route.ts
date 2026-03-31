import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext, req }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Contexto da academia invalido" },
        { status: 400 },
      );
    }

    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const stats = await GymInventoryService.getStats(gymId, { fresh });
    return NextResponse.json({ stats });
  },
  {
    auth: "gym",
  },
);
