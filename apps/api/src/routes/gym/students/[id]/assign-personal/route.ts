import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { featureFlags } from "@/lib/feature-flags";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { NextResponse } from "@/runtime/next-server";

const paramsSchema = z.object({
  id: z.string().cuid(),
});

const assignSchema = z.object({
  personalId: z.string().cuid(),
});

const removeSchema = z.object({
  personalId: z.string().cuid(),
});

export const POST = createSafeHandler(
  async ({ gymContext, params, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const gymId = gymContext?.gymId || "";
    const studentId = params?.id || "";
    const { personalId } = body as { personalId: string };

    const assignment = await StudentPersonalService.assignByGym({
      studentId,
      personalId,
      gymId,
    });

    return NextResponse.json({ assignment });
  },
  { auth: "gym", schema: { params: paramsSchema, body: assignSchema } },
);

export const DELETE = createSafeHandler(
  async ({ gymContext, params, body }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const gymId = gymContext?.gymId || "";
    const studentId = params?.id || "";
    const { personalId } = body as { personalId: string };

    const assignment = await StudentPersonalService.removeAssignment({
      studentId,
      personalId,
      gymId,
    });

    return NextResponse.json({ assignment });
  },
  { auth: "gym", schema: { params: paramsSchema, body: removeSchema } },
);
