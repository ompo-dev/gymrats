import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Cron: Reset semanal - Segunda 3h BRT
 * Limpa weekOverride dos students para alinhar à semana calendário
 *
 * Vercel Cron: 0 6 * * 1 (06:00 UTC = 03:00 BRT)
 */
export async function GET(request: Request) {
  // Verificar CRON_SECRET (Vercel envia em cron jobs)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Limpar weekOverride de todos os students
    // Isso faz com que getWeekStart use a segunda da semana calendário
    await db.student.updateMany({
      data: { weekOverride: null },
    });

    return NextResponse.json({
      success: true,
      message: "Week reset cron executed",
    });
  } catch (error) {
    console.error("[week-reset cron] Erro:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
