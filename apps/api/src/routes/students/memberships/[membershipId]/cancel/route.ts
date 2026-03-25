import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { StudentMembershipService } from "@/lib/services/student/student-membership.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  membershipId: z.string().min(1),
});

export const POST = createSafeHandler(
  async ({ studentContext, params }) => {
    const { membershipId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;
    if (!studentId) {
      return NextResponse.json(
        { error: "Aluno nao encontrado" },
        { status: 400 },
      );
    }

    await StudentMembershipService.cancelMembership(membershipId, studentId);
    return NextResponse.json({ success: true });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
