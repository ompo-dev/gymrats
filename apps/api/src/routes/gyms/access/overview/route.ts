import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { AccessService } from "@/lib/services/access/access.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const overview = await AccessService.getOverview(gymContext!.gymId);
    return NextResponse.json({ overview });
  },
  { auth: "gym" },
);
