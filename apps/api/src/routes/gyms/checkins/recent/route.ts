import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const checkIns = await GymMemberService.getRecentCheckIns(
      gymContext?.gymId,
    );
    return NextResponse.json({ checkIns });
  },
  {
    auth: "gym",
  },
);
