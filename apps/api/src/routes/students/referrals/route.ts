import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";
import { db } from "@/lib/db";

export const GET = createSafeHandler(
  async ({ studentContext }) => {
    const { studentId } = studentContext!;

    const [code, data, student] = await Promise.all([
      ReferralService.getOrGenerateCode(studentId),
      ReferralService.getBalanceAndWithdraws(studentId),
      db.student.findUnique({
        where: { id: studentId },
        select: { pixKey: true, pixKeyType: true },
      }),
    ]);

    return NextResponse.json({
      referralCode: code,
      pixKey: student?.pixKey ?? null,
      pixKeyType: student?.pixKeyType ?? null,
      ...data,
    });
  },
  { auth: "student" },
);
