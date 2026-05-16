import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { shouldSimulatePayout } from "@/lib/payments/payout-execution";
import { auditLog } from "@/lib/security/audit-log";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";
import { NextResponse } from "@/runtime/next-server";

const createWithdrawSchema = z.object({
  amountCents: z
    .number({ invalid_type_error: "amountCents deve ser um numero" })
    .int("amountCents deve ser inteiro")
    .min(350, "Valor minimo para saque e R$ 3,50"),
}).strict();

export const GET = createSafeHandler(
  async ({ gymContext, req }) => {
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const data = await GymFinancialService.getBalanceAndWithdraws(
      gymContext!.gymId,
      { fresh },
    );
    return NextResponse.json(data);
  },
  { auth: "gym" },
);

export const POST = createSafeHandler(
  async ({ body, gymContext, req }) => {
    const simulation = shouldSimulatePayout();
    const result = await GymFinancialService.createWithdraw(gymContext!.gymId, {
      amountCents: body.amountCents,
      fake: simulation,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (simulation) {
      await auditLog({
        action: "PAYMENT:COMPLETED",
        actorId: gymContext?.user?.id ?? null,
        targetId: gymContext?.gymId ?? null,
        request: req.headers,
        payload: {
          simulation: true,
          scope: "gym_withdraw",
          withdrawId: result.withdraw.id,
          amount: result.withdraw.amount,
        },
        result: "SUCCESS",
      });
    }

    return NextResponse.json({
      success: true,
      withdraw: result.withdraw,
    });
  },
  { auth: "gym", schema: { body: createWithdrawSchema } },
);
