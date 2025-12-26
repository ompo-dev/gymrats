import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // No Next.js 16+, params pode ser uma Promise
    const resolvedParams = await Promise.resolve(params);
    const workoutId = resolvedParams.id;

    if (!workoutId) {
      return NextResponse.json(
        { error: "ID do workout não fornecido" },
        { status: 400 }
      );
    }

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

    // Salvar ou atualizar progresso no banco de dados
    const progressData = {
      studentId,
      workoutId,
      currentExerciseIndex,
      exerciseLogs: JSON.stringify(exerciseLogs || []),
      skippedExercises: skippedExercises
        ? JSON.stringify(skippedExercises)
        : null,
      selectedAlternatives: selectedAlternatives
        ? JSON.stringify(selectedAlternatives)
        : null,
      xpEarned: xpEarned || 0,
      totalVolume: totalVolume || 0,
      completionPercentage: completionPercentage || 0,
      startTime: startTime ? new Date(startTime) : new Date(),
      cardioPreference: cardioPreference || null,
      cardioDuration: cardioDuration || null,
      selectedCardioType: selectedCardioType || null,
    };

    // Usar upsert para criar ou atualizar
    const progress = await db.workoutProgress.upsert({
      where: {
        studentId_workoutId: {
          studentId,
          workoutId,
        },
      },
      create: progressData,
      update: progressData,
    });

    return NextResponse.json({
      success: true,
      message: "Progresso salvo com sucesso",
      progress: {
        id: progress.id,
        currentExerciseIndex: progress.currentExerciseIndex,
        xpEarned: progress.xpEarned,
        totalVolume: progress.totalVolume,
        completionPercentage: progress.completionPercentage,
      },
    });
  } catch (error: any) {
    console.error("Erro ao salvar progresso:", error);
    
    // Se a tabela não existir, informar que precisa rodar a migration
    if (
      error.message?.includes("does not exist") ||
      error.message?.includes("workout_progress")
    ) {
      return NextResponse.json(
        {
          error: "Tabela workout_progress não existe. Execute: node scripts/migration/apply-workout-progress-migration.js",
          code: "MIGRATION_REQUIRED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erro ao salvar progresso" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const studentId = session.user.student.id;
    const resolvedParams = await Promise.resolve(params);
    const workoutId = resolvedParams.id;

    if (!workoutId) {
      return NextResponse.json(
        { error: "ID do workout não fornecido" },
        { status: 400 }
      );
    }

    // Buscar progresso do banco de dados
    const progress = await db.workoutProgress.findUnique({
      where: {
        studentId_workoutId: {
          studentId,
          workoutId,
        },
      },
    });

    if (!progress) {
      return NextResponse.json({
        progress: null,
        message: "Nenhum progresso encontrado",
      });
    }

    // Parsear JSON strings
    const exerciseLogs = JSON.parse(progress.exerciseLogs || "[]");
    const skippedExercises = progress.skippedExercises
      ? JSON.parse(progress.skippedExercises)
      : [];
    const selectedAlternatives = progress.selectedAlternatives
      ? JSON.parse(progress.selectedAlternatives)
      : {};

    return NextResponse.json({
      progress: {
        id: progress.id,
        workoutId: progress.workoutId,
        currentExerciseIndex: progress.currentExerciseIndex,
        exerciseLogs,
        skippedExercises,
        selectedAlternatives,
        xpEarned: progress.xpEarned,
        totalVolume: progress.totalVolume,
        completionPercentage: progress.completionPercentage,
        startTime: progress.startTime,
        cardioPreference: progress.cardioPreference,
        cardioDuration: progress.cardioDuration,
        selectedCardioType: progress.selectedCardioType,
        lastUpdated: progress.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar progresso:", error);
    
    // Se a tabela não existir, retornar null sem erro
    if (
      error.message?.includes("does not exist") ||
      error.message?.includes("workout_progress")
    ) {
      return NextResponse.json({
        progress: null,
        message: "Tabela workout_progress não existe. Execute: node scripts/migration/apply-workout-progress-migration.js",
      });
    }

    return NextResponse.json(
      { error: error.message || "Erro ao buscar progresso" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const workoutId = resolvedParams.id;

    if (!workoutId) {
      return NextResponse.json(
        { error: "ID do workout não fornecido" },
        { status: 400 }
      );
    }

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

    // Deletar progresso parcial
    await db.workoutProgress.deleteMany({
      where: {
        studentId,
        workoutId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Progresso parcial removido",
    });
  } catch (error: any) {
    console.error("Erro ao deletar progresso:", error);
    
    // Se a tabela não existir, retornar sucesso (não há nada para deletar)
    if (
      error.message?.includes("does not exist") ||
      error.message?.includes("workout_progress")
    ) {
      return NextResponse.json({
        success: true,
        message: "Tabela não existe, nada para deletar",
      });
    }

    return NextResponse.json(
      { error: error.message || "Erro ao deletar progresso" },
      { status: 500 }
    );
  }
}

