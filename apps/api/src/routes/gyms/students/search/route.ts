import { gymStudentsSearchQuerySchema } from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ gymContext, query }) => {
    const gymId = gymContext?.gymId;
    if (!gymId) {
      return NextResponse.json(
        { error: "Contexto da academia invalido" },
        { status: 400 },
      );
    }

    const result = await GymDomainService.searchStudentByEmail(
      gymId,
      query.email,
    );
    return NextResponse.json(result);
  },
  {
    auth: "gym",
    schema: { query: gymStudentsSearchQuerySchema },
  },
);
