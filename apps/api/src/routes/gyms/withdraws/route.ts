import { NextResponse } from "@/runtime/next-server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymFinancialService } from "@/lib/services/gym/gym-financial.service";

type CreateWithdrawBody = {
  amountCents: number;
  fake?: boolean;
};

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
    const result = await GymFinancialService.createWithdraw(gymContext!.gymId, {
      amountCents: (body as CreateWithdrawBody).amountCents,
      fake: (body as CreateWithdrawBody).fake ?? true,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      withdraw: result.withdraw,
    });
  },
  { auth: "gym" },
);
