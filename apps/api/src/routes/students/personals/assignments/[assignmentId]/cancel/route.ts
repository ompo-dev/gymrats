import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({
  assignmentId: z.string().min(1),
});

/**
 * POST /api/students/personals/assignments/[assignmentId]/cancel
 * Desvincula o aluno do personal (atualiza status para removed).
 */
export const POST = createSafeHandler(
  async ({ studentContext, params }) => {
    const { assignmentId } = paramsSchema.parse(params);
    const studentId = studentContext?.studentId;

    const assignment = await db.studentPersonalAssignment.findFirst({
      where: { id: assignmentId, studentId },
      select: { id: true, status: true },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "Vínculo não encontrado ou você não tem permissão para desvincular.",
        },
        { status: 404 },
      );
    }

    if (assignment.status === "removed") {
      return NextResponse.json({ success: true });
    }

    await db.studentPersonalAssignment.update({
      where: { id: assignmentId },
      data: { status: "removed" },
    });

    return NextResponse.json({ success: true });
  },
  {
    auth: "student",
    schema: { params: paramsSchema },
  },
);
