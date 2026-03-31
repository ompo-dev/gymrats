import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ personalContext, req }) => {
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const payments = await PersonalFinancialService.getPayments(
      personalContext!.personalId,
      { fresh },
    );

    return NextResponse.json({ payments });
  },
  {
    auth: "personal",
  },
);
