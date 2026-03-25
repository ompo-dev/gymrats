import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { featureFlags } from "@/lib/feature-flags";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export const GET = createSafeHandler(
  async ({ personalContext, params }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }

    const { id } = paramsSchema.parse(params);
    const student = await StudentPersonalService.getStudentByIdAsStudentData(
      personalContext!.personalId,
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
    auth: "personal",
    schema: { params: paramsSchema },
  },
);
