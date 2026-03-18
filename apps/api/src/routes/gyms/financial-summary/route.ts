import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";

export const GET = createSafeHandler(
  async ({ gymContext, req }) => {
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const summary = await GymFinancialService.getFinancialSummary(
      gymContext?.gymId,
      { fresh },
    );
    return NextResponse.json({ summary });
  },
  {
    auth: "gym",
  },
);
