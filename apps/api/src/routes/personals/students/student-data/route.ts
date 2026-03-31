import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { featureFlags } from "@/lib/feature-flags";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { NextResponse } from "@/runtime/next-server";

const querySchema = z.object({
  gymId: z.string().optional(),
});

export const GET = createSafeHandler(
  async ({ personalContext, query, req }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }

    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const students = await StudentPersonalService.listStudentsAsStudentData(
      personalContext!.personalId,
      (query as { gymId?: string }).gymId,
      { fresh },
    );

    return NextResponse.json({ students });
  },
  {
    auth: "personal",
    schema: { query: querySchema },
  },
);
