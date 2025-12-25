import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const workoutId = params.id;
    const studentId = session.user.student.id;

    // Ler dados do body
    const body = await request.json();
    const {
      currentExerciseIndex,
      exerciseLogs,
      skippedExercises,
      selectedAlternatives,
      xpEarned,
      totalVolume,
      completionPercentage,
      startTime,
      cardioPreference,
      cardioDuration,
      selectedCardioType,
    } = body;

    // Por enquanto, vamos salvar o progresso no localStorage via Zustand
    // Mas podemos criar uma tabela de WorkoutProgress se necessário no futuro
    // Por enquanto, apenas validar e retornar sucesso

    // Validar dados
    if (
      typeof currentExerciseIndex !== "number" ||
      currentExerciseIndex < 0
    ) {
      return NextResponse.json(
        { error: "currentExerciseIndex inválido" },
        { status: 400 }
      );
    }

    // Verificar se o workout existe
    const workout = await db.workout.findUnique({
      where: { id: workoutId },
    });

    if (!workout) {
      return NextResponse.json(
        { error: "Workout não encontrado" },
        { status: 404 }
      );
    }

    // Progresso parcial é salvo no localStorage (Zustand)
    // Esta API apenas valida e confirma que está tudo ok
    // No futuro, podemos criar uma tabela WorkoutProgress para salvar no DB

    return NextResponse.json({
      success: true,
      message: "Progresso salvo localmente",
    });
  } catch (error: any) {
    console.error("Erro ao salvar progresso:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar progresso" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const workoutId = params.id;

    // Por enquanto, progresso parcial é gerenciado pelo Zustand (localStorage)
    // Esta API retorna vazio, mas pode ser usada no futuro para buscar progresso do DB

    return NextResponse.json({
      progress: null,
      message: "Progresso parcial é gerenciado localmente",
    });
  } catch (error: any) {
    console.error("Erro ao buscar progresso:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar progresso" },
      { status: 500 }
    );
  }
}

