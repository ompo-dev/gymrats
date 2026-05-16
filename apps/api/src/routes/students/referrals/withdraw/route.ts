import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { shouldSimulatePayout } from "@/lib/payments/payout-execution";
import { auditLog } from "@/lib/security/audit-log";
import { ReferralService } from "@/lib/services/referral.service";
import { NextResponse } from "@/runtime/next-server";

const withdrawSchema = z.object({
  amountCents: z
    .number({ invalid_type_error: "amountCents deve ser um número" })
    .int("amountCents deve ser inteiro")
    .min(350, "Valor mínimo para saque é R$ 3,50"),
}).strict();

export const POST = createSafeHandler(
  async ({ body, studentContext, req }) => {
    const { studentId } = studentContext!;
    const { amountCents } = body as z.infer<typeof withdrawSchema>;
    const simulation = shouldSimulatePayout();
    const result = await ReferralService.createWithdraw(studentId, {
      amountCents,
      fake: simulation,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!("withdraw" in result) || !result.withdraw) {
      return NextResponse.json(
        { error: "Falha ao criar saque" },
        { status: 500 },
      );
    }
    const withdraw = result.withdraw;

    if (simulation) {
      await auditLog({
        action: "PAYMENT:COMPLETED",
        actorId: studentContext?.user?.id ?? null,
        targetId: studentId,
        request: req.headers,
        payload: {
          simulation: true,
          scope: "student_referral_withdraw",
          withdrawId: withdraw.id,
          amount: withdraw.amount,
        },
        result: "SUCCESS",
      });
    }

    return NextResponse.json({ withdraw });
  },
  {
    auth: "student",
    schema: { body: withdrawSchema },
  },
);

