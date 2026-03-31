import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";
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
    const checkIns = await GymMemberService.getRecentCheckIns(gymId, { fresh });
    return NextResponse.json({ checkIns });
  },
  {
    auth: "gym",
  },
);
