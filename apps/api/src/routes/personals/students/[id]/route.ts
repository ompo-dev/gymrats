import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { featureFlags } from "@/lib/feature-flags";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/personals/students/[id]
 * Retorna o detalhe do aluno para o personal.
 * Requer: aluno atribuído ao personal logado.
 */
export const GET = createSafeHandler(
  async ({ personalContext, params }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId;
    if (!personalId) {
      return NextResponse.json(
        { error: "Personal não autenticado" },
        { status: 401 },
      );
    }
    const studentId = params?.id;
    if (!studentId) {
      return NextResponse.json(
        { error: "ID do aluno é obrigatório" },
        { status: 400 },
      );
    }
    const assignment =
      await StudentPersonalService.getStudentDetailForPersonal(
        personalId,
        studentId,
      );
    if (!assignment) {
      return NextResponse.json(
        { error: "Aluno não encontrado ou não está atribuído a você" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      assignment: {
        id: assignment.id,
        student: {
          id: assignment.student.id,
          avatar: assignment.student.avatar ?? null,
          user: assignment.student.user,
          profile: assignment.student.profile,
          progress: assignment.student.progress,
          records: assignment.student.records ?? [],
        },
        gym: assignment.gym,
      },
    });
  },
  {
    auth: "personal",
    schema: { params: paramsSchema },
  },
);
