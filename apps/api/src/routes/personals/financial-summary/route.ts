import { log } from "@/lib/observability";
import { PersonalFinancialService } from "@/lib/services/personal/personal-financial.service";
import { getPersonalContext } from "@/lib/utils/personal/personal-context";
import { NextResponse } from "@/runtime/next-server";

export async function GET(request: Request) {
  try {
    const { ctx, errorResponse } = await getPersonalContext(request);
    if (errorResponse || !ctx) {
      return (
        errorResponse ??
        NextResponse.json({ error: "Não autenticado" }, { status: 401 })
      );
    }
    const fresh = new URL(request.url).searchParams.get("fresh") === "1";
    const financialSummary = await PersonalFinancialService.getFinancialSummary(
      ctx.personalId,
      { fresh },
    );
    return NextResponse.json({ financialSummary });
  } catch (error) {
    log.error("[GET /api/personals/financial-summary] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
