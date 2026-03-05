import { NextResponse } from "next/server";
import { personalStudentsSearchQuerySchema } from "@/lib/api/schemas/personals.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { featureFlags } from "@/lib/feature-flags";

export const GET = createSafeHandler(
  async ({ personalContext, query }) => {
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
    const result = await StudentPersonalService.searchStudentByEmail(
      personalId,
      query.email,
    );
    return NextResponse.json(result);
  },
  {
    auth: "personal",
    schema: { query: personalStudentsSearchQuerySchema },
  },
);
