import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";
import type { ExerciseLog } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // No Next.js 16+, params pode ser uma Promise
    const resolvedParams = await Promise.resolve(params);
    const workoutId = resolvedParams.id;
    
    console.log("[DEBUG] workoutId recebido:", workoutId);

    if (!workoutId) {
      return NextResponse.json(
        { error: "ID do workout não fornecido" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return NextResponse.json(
        { error: "Sessão inválida ou usuário não é aluno" },
        { status: 401 }
      );
    }
    const studentId = session.user.student.id;

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

    // Ler dados do body
    const body = await request.json();
    const {
      exerciseLogs,
      duration,
      totalVolume,
      overallFeedback,
      bodyPartsFatigued,
      startTime,
    } = body;

    // Calcular duração se não fornecida
    const workoutDuration =
      duration ||
      (startTime
        ? Math.round(
            (new Date().getTime() - new Date(startTime).getTime()) / 60000
          )
        : workout.estimatedTime);

    // Criar WorkoutHistory
    const workoutHistory = await db.workoutHistory.create({
      data: {
        studentId: studentId,
        workoutId: workoutId,
        date: new Date(),
        duration: workoutDuration,
        totalVolume: totalVolume || 0,
        overallFeedback: overallFeedback || null,
        bodyPartsFatigued: bodyPartsFatigued
          ? JSON.stringify(bodyPartsFatigued)
          : null,
      },
    });

    // Criar ExerciseLogs
    if (
      exerciseLogs &&
      Array.isArray(exerciseLogs) &&
      exerciseLogs.length > 0
    ) {
      await Promise.all(
        exerciseLogs.map((log: ExerciseLog) =>
          db.exerciseLog.create({
            data: {
              workoutHistoryId: workoutHistory.id,
              exerciseId: log.exerciseId,
              exerciseName: log.exerciseName,
              sets: JSON.stringify(log.sets),
              notes: log.notes || null,
              formCheckScore: log.formCheckScore || null,
              difficulty: log.difficulty || null,
            },
          })
        )
      );
    }

    // Limpar progresso parcial após completar o workout
    try {
      await db.workoutProgress.deleteMany({
        where: {
          studentId,
          workoutId,
        },
      });
    } catch (error: any) {
      // Ignorar erro se a tabela não existir (migration não aplicada)
      if (
        !error.message?.includes("does not exist") &&
        !error.message?.includes("workout_progress")
      ) {
        console.error("Erro ao limpar progresso parcial:", error);
      }
    }

    // Atualizar StudentProgress
    const progress = await db.studentProgress.findUnique({
      where: { studentId: studentId },
    });

    if (progress) {
      const xpEarned = body.xpEarned || workout.xpReward;
      const newTotalXP = progress.totalXP + xpEarned;
      const newTodayXP = progress.todayXP + xpEarned;
      const newWorkoutsCompleted = progress.workoutsCompleted + 1;

      // Calcular novo nível (100 XP por nível)
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      const newXpToNextLevel = newLevel * 100 - newTotalXP;

      // Atualizar streak
      const today = new Date();
      const lastActivity = progress.lastActivityDate
        ? new Date(progress.lastActivityDate)
        : null;

      let newStreak = progress.currentStreak;
      let newLongestStreak = progress.longestStreak;

      if (lastActivity) {
        const daysDiff = Math.floor(
          (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 0) {
          // Mesmo dia, manter streak
        } else if (daysDiff === 1) {
          // Dia seguinte, incrementar streak
          newStreak = progress.currentStreak + 1;
          newLongestStreak = Math.max(newStreak, progress.longestStreak);
        } else {
          // Mais de 1 dia, resetar streak
          newStreak = 1;
        }
      } else {
        // Primeira atividade
        newStreak = 1;
        newLongestStreak = 1;
      }

      await db.studentProgress.update({
        where: { studentId: studentId },
        data: {
          totalXP: newTotalXP,
          todayXP: newTodayXP,
          currentLevel: newLevel,
          xpToNextLevel: newXpToNextLevel,
          workoutsCompleted: newWorkoutsCompleted,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: today,
        },
      });
    }

    // Verificar e criar PersonalRecords
    if (exerciseLogs && Array.isArray(exerciseLogs)) {
      for (const log of exerciseLogs) {
        if (!log.sets || log.sets.length === 0) continue;

        // Encontrar melhor performance neste exercício
        const bestSet = log.sets.reduce((best: any, set: any) => {
          if (!set.completed || set.weight <= 0 || set.reps <= 0) return best;
          const volume = set.weight * set.reps;
          if (!best || volume > best.volume) {
            return { weight: set.weight, reps: set.reps, volume };
          }
          return best;
        }, null);

        if (bestSet) {
          // Verificar se já existe recorde para este exercício
          const existingRecord = await db.personalRecord.findFirst({
            where: {
              studentId: studentId,
              exerciseId: log.exerciseId,
              type: "max-weight",
            },
            orderBy: { date: "desc" },
          });

          // Se não existe ou o novo é melhor
          if (!existingRecord || bestSet.weight > existingRecord.value) {
            await db.personalRecord.create({
              data: {
                studentId: studentId,
                workoutHistoryId: workoutHistory.id,
                exerciseId: log.exerciseId,
                exerciseName: log.exerciseName,
                type: "max-weight",
                value: bestSet.weight,
                previousBest: existingRecord?.value || null,
                date: new Date(),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      workoutHistoryId: workoutHistory.id,
      xpEarned: body.xpEarned || workout.xpReward,
    });
  } catch (error: any) {
    console.error("Erro ao completar workout:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar workout" },
      { status: 500 }
    );
  }
}
