import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const students = await GymMemberService.getStudents(gymContext!.gymId);
    return NextResponse.json({ students });
  },
  {
    auth: "gym",
  },
);
