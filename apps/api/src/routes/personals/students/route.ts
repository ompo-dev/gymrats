import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { featureFlags } from "@/lib/feature-flags";

const querySchema = z.object({
  gymId: z.string().optional(),
});

export const GET = createSafeHandler(
  async ({ personalContext, query }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const personalId = personalContext?.personalId || "";
    const gymId = (query as { gymId?: string }).gymId;
    const students = await StudentPersonalService.listStudentsByPersonal(
      personalId,
      gymId,
    );
    return NextResponse.json({ students });
  },
  { auth: "personal", schema: { query: querySchema } },
);
