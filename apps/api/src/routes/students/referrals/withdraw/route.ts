import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";

const withdrawSchema = z.object({
  amountCents: z
    .number({ invalid_type_error: "amountCents deve ser um número" })
    .int("amountCents deve ser inteiro")
    .min(350, "Valor mínimo para saque é R$ 3,50"),
});

export const POST = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId } = studentContext!;
    const { amountCents } = body as z.infer<typeof withdrawSchema>;

    const isDev = process.env.NODE_ENV !== "production";
    const result = await ReferralService.createWithdraw(studentId, {
      amountCents,
      fake: isDev,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ withdraw: result.withdraw });
  },
  {
    auth: "student",
    schema: { body: withdrawSchema },
  },
);
