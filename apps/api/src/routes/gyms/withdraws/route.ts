import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";

const createWithdrawSchema = z.object({
  amountCents: z
    .number({ invalid_type_error: "amountCents deve ser um numero" })
    .int("amountCents deve ser inteiro")
    .min(350, "Valor minimo para saque e R$ 3,50"),
  fake: z.boolean().optional(),
});

export const GET = createSafeHandler(
  async ({ gymContext }) => {
    const data = await GymFinancialService.getBalanceAndWithdraws(
      gymContext!.gymId,
    );
    return NextResponse.json(data);
  },
  { auth: "gym" },
);

export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const isDev = process.env.NODE_ENV !== "production";
    const result = await GymFinancialService.createWithdraw(gymContext!.gymId, {
      amountCents: body.amountCents,
      fake: body.fake ?? isDev,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      withdraw: result.withdraw,
    });
  },
  { auth: "gym", schema: { body: createWithdrawSchema } },
);
