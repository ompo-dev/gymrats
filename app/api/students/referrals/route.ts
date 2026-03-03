import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";

export const GET = createSafeHandler(
  async ({ studentContext }) => {
    const { studentId } = studentContext!;
    
    // Assegura que tem um code para referências
    const code = await ReferralService.getOrGenerateCode(studentId);

    // Pega balance e histórico de saques
    const data = await ReferralService.getBalanceAndWithdraws(studentId);

    return NextResponse.json({
      referralCode: code,
      ...data,
    });
  },
  { auth: "student" },
);
