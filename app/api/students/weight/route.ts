import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
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

    // Ler dados do body
    const body = await request.json();
    const { weight, date, notes } = body;

    // Validar dados
    if (!weight || typeof weight !== "number" || weight <= 0) {
      return NextResponse.json(
        { error: "Peso inválido. Deve ser um número maior que zero." },
        { status: 400 }
      );
    }

    // Criar entrada de peso
    const weightEntry = await db.weightHistory.create({
      data: {
        studentId: studentId,
        weight: weight,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    });

    // Atualizar peso atual no StudentProfile
    await db.studentProfile.update({
      where: { studentId: studentId },
      data: { weight: weight },
    });

    return NextResponse.json({
      success: true,
      weightEntry: {
        id: weightEntry.id,
        weight: weightEntry.weight,
        date: weightEntry.date,
        notes: weightEntry.notes,
      },
    });
  } catch (error: any) {
    console.error("Erro ao adicionar peso:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar peso" },
      { status: 500 }
    );
  }
}

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

    // Buscar histórico de peso
    const weightHistory = await db.weightHistory.findMany({
      where: {
        studentId: studentId,
      },
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
      where: {
        studentId: studentId,
      },
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

