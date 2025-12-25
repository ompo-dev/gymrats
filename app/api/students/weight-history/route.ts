import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return NextResponse.json(
        { error: "Sessão inválida ou usuário não é aluno" },
        { status: 401 }
      );
    }

    const studentId = session.user.student.id;

    // Ler query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Construir filtros
    const where: any = {
      studentId: studentId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Buscar histórico de peso
    const weightHistory = await db.weightHistory.findMany({
      where: where,
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transformar para formato esperado
    const formattedHistory = weightHistory.map((wh) => ({
      date: wh.date,
      weight: wh.weight,
      notes: wh.notes || undefined,
    }));

    // Contar total de registros
    const total = await db.weightHistory.count({
      where: where,
    });

    return NextResponse.json({
      history: formattedHistory,
      total: total,
      limit: limit,
      offset: offset,
    });
  } catch (error: any) {
    console.error("Erro ao buscar histórico de peso:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}

