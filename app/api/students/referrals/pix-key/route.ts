import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";

export const POST = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId } = studentContext!;
    const { pixKey, pixKeyType } = body as { pixKey: string; pixKeyType: string };

    if (!pixKey || !pixKeyType) {
      return NextResponse.json(
        { error: "Pix key ou type inválidos" },
        { status: 400 }
      );
    }

    await ReferralService.updatePixKey(studentId, pixKey, pixKeyType);

    return NextResponse.json({ success: true, pixKey, pixKeyType });
  },
  { auth: "student" },
);
