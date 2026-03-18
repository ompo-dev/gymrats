import { NextResponse } from "@/runtime/next-server";
import {
  createGymExpenseSchema,
  gymExpensesQuerySchema,
} from "@/lib/api/schemas/gyms.schemas";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";

// GET — listar despesas
export const GET = createSafeHandler(
  async ({ query, gymContext, req }) => {
    const { gymId } = gymContext!;
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const expenses = await GymDomainService.getExpenses(gymId, {
      ...(query as Record<string, string | undefined>),
      fresh,
    });
    return NextResponse.json({ expenses });
  },
  {
    auth: "gym",
    schema: { query: gymExpensesQuerySchema },
  },
);

// POST — criar nova despesa
export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    const expense = await GymDomainService.createExpense(gymId, body);
    return NextResponse.json({ expense }, { status: 201 });
  },
  {
    auth: "gym",
    schema: { body: createGymExpenseSchema },
  },
);
