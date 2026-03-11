import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";

export const GET = createSafeHandler(
  async ({ personalContext }) => {
    const payments = await PersonalFinancialService.getPayments(
      personalContext!.personalId,
    );

    return NextResponse.json({ payments });
  },
  {
    auth: "personal",
  },
);
