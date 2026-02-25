import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const summary = await GymFinancialService.getFinancialSummary(gymContext!.gymId);
    return NextResponse.json({ summary });
  },
  {
    auth: "gym",
  },
);
