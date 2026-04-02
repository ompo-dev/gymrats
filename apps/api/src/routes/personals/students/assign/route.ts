import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { featureFlags } from "@/lib/feature-flags";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { NextResponse } from "@/runtime/next-server";

const assignByPersonalSchema = z.object({
  studentId: z.string().cuid("studentId deve ser um CUID valido"),
  gymId: z.string().cuid("gymId deve ser um CUID valido").optional(),
});

const removeAssignmentSchema = z.object({
  studentId: z.string().cuid("studentId deve ser um CUID valido"),
});

export const POST = createSafeHandler(
  async ({ personalContext, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId || "";
    const { studentId, gymId } = body as { studentId: string; gymId?: string };

    const assignment = await StudentPersonalService.assignByPersonal({
      studentId,
      personalId,
      gymId,
    });

    return NextResponse.json({ assignment });
  },
  { auth: "personal", schema: { body: assignByPersonalSchema } },
);

export const DELETE = createSafeHandler(
  async ({ personalContext, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId || "";
    const { studentId } = body as { studentId: string };

    const assignment = await StudentPersonalService.removeAssignment({
      studentId,
      personalId,
    });

    return NextResponse.json({ assignment });
  },
  { auth: "personal", schema: { body: removeAssignmentSchema } },
);
