import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";

export const GET = createSafeHandler(
  async ({ gymContext, req }) => {
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const checkIns = await GymMemberService.getRecentCheckIns(
      gymContext?.gymId,
      { fresh },
    );
    return NextResponse.json({ checkIns });
  },
  {
    auth: "gym",
  },
);
