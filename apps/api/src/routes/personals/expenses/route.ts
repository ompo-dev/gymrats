import { NextResponse } from "@/runtime/next-server";
import { db } from "@/lib/db";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";

export async function GET(request: Request) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const expenses = await PersonalFinancialService.getExpenses(ctx.personalId);
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("[GET /api/personals/expenses] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return errorResponse ?? NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { type, description, amount, date, category } = body;

    if (!type || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios: type, amount (> 0)" },
        { status: 400 },
      );
    }

    const expense = await db.personalExpense.create({
      data: {
        personalId: ctx.personalId,
        type,
        description: description || null,
        amount,
        date: date ? new Date(date) : new Date(),
        category: category || null,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/personals/expenses] Erro:", error);
    return NextResponse.json({ error: "Erro ao criar despesa" }, { status: 500 });
  }
}
