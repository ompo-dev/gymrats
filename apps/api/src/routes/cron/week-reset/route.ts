import { resetStudentWeeklyOverride } from "@gymrats/workflows";
import { NextResponse } from "@/runtime/next-server";

/**
 * Cron: Reset semanal - Segunda 3h BRT
 * Limpa weekOverride dos students para alinhar a semana calendario.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await resetStudentWeeklyOverride();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[week-reset cron] Erro:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
