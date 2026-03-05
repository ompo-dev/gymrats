import { NextResponse } from "next/server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";

const paramsSchema = z.object({
  studentId: z.string().min(1),
});

/**
 * POST /api/personals/students/[studentId]/unassign
 * Desvincula o aluno do personal (atualiza status do assignment para removed).
 * Usado quando o personal remove um aluno da sua lista.
 */
export const POST = createSafeHandler(
  async ({ personalContext, params }) => {
    const { studentId } = paramsSchema.parse(params);
    const personalId = personalContext?.personalId;

    if (!personalId) {
      return NextResponse.json(
        { error: "Não autenticado como personal" },
        { status: 401 },
      );
    }

    const assignment = await db.studentPersonalAssignment.findFirst({
      where: { studentId, personalId, status: "active" },
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            "Vínculo não encontrado ou o aluno já foi desvinculado.",
        },
        { status: 404 },
      );
    }

    await db.studentPersonalAssignment.update({
      where: { id: assignment.id },
      data: { status: "removed" },
    });

    return NextResponse.json({ success: true });
  },
  {
    auth: "personal",
    schema: { params: paramsSchema },
  },
);
