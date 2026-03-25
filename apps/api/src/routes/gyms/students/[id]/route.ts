import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymMemberService } from "@/lib/services/gym/gym-member.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ gymContext, params }) => {
    const { id } = paramsSchema.parse(params);
    const student = await GymMemberService.getStudentById(
      gymContext!.gymId,
      id,
    );

    if (!student) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ student });
  },
  {
    auth: "gym",
    schema: { params: paramsSchema },
  },
);
