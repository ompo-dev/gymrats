/**
 * Handler de Workouts
 *
 * Centraliza toda a lógica das rotas relacionadas a workouts
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateStreak } from "@/lib/use-cases/workouts/streak";
import { getUnitsUseCase } from "@/lib/use-cases/workouts/get-units";
import { getWeeklyPlanUseCase } from "@/lib/use-cases/workouts/get-weekly-plan";
import { requireStudent } from "../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware";
import type { z } from "zod";
import {
  completeWorkoutSchema,
  saveWorkoutProgressSchema,
  updateExerciseLogSchema,
  workoutHistoryQuerySchema,
} from "../schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response.utils";

/**
 * GET /api/workouts/units
 * Busca units com workouts e exercícios
 */
export async function getUnitsHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const { units } = await getUnitsUseCase({
      studentId: auth.user.student!.id,
    });

    return successResponse({ units });
  } catch (error) {
    console.error("[getUnitsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar treinos", error);
  }
}

/**
 * GET /api/workouts/weekly-plan
 * Busca WeeklyPlan com 7 slots (Seg-Dom), locked/completed por semana
 */
export async function getWeeklyPlanHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const student = await db.student.findUnique({
      where: { id: auth.user.student!.id },
      select: { weekOverride: true },
    });

    const result = await getWeeklyPlanUseCase({
      studentId: auth.user.student!.id,
      weekOverride: student?.weekOverride ?? null,
    });

    if (!result.weeklyPlan) {
      return successResponse({
        weeklyPlan: null,
        message: "Nenhum plano semanal. Crie um plano para começar.",
      });
    }

    return successResponse(
      {
        weeklyPlan: result.weeklyPlan,
        weekStart: result.weekStart.toISOString(),
      },
      200,
      { "Cache-Control": "no-store, no-cache, must-revalidate" },
    );
  } catch (error) {
    console.error("[getWeeklyPlanHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar plano semanal");
  }
}

/**
 * POST /api/workouts/[id]/complete
 * Completa um workout
 */
export async function completeWorkoutHandler(
  request: NextRequest,
  workoutId: string,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student!.id;

    if (!workoutId) {
      return badRequestResponse("ID do workout não fornecido");
    }

    // Verificar se o workout existe
    const workout = await db.workout.findUnique({
      where: { id: workoutId },
    });

    if (!workout) {
      return notFoundResponse("Workout não encontrado");
    }

    // Validar body com Zod
    const validation = await validateBody<
      z.infer<typeof completeWorkoutSchema>
    >(request, completeWorkoutSchema);
    if (!validation.success) {
      return validation.response;
    }

    const {
      exerciseLogs,
      duration,
      totalVolume,
      overallFeedback,
      bodyPartsFatigued,
      startTime,
    } = validation.data;

    // Calcular duração
    // Se duration for 0 ou não fornecido, calcular a partir do startTime ou usar estimatedTime
    const workoutDuration =
      duration !== undefined && duration !== null
        ? duration
        : startTime
          ? Math.round((Date.now() - new Date(startTime).getTime()) / 60000)
          : workout.estimatedTime;

    // Criar WorkoutHistory
    const workoutHistory = await db.workoutHistory.create({
      data: {
        studentId: studentId,
        workoutId: workoutId,
        date: new Date(),
        duration: workoutDuration,
        totalVolume: totalVolume || 0,
        overallFeedback: overallFeedback || "regular",
        bodyPartsFatigued: bodyPartsFatigued
          ? JSON.stringify(bodyPartsFatigued)
          : null,
      },
    });

    // Criar ExerciseLogs
    if (exerciseLogs && Array.isArray(exerciseLogs)) {
      for (const log of exerciseLogs) {
        await db.exerciseLog.create({
          data: {
            workoutHistoryId: workoutHistory.id,
            exerciseId: log.exerciseId,
            exerciseName: log.exerciseName,
            sets: JSON.stringify(log.sets || []),
            notes: log.notes || null,
            formCheckScore: log.formCheckScore || null,
            difficulty: log.difficulty || null,
          },
        });
      }
    }

    // Calcular streak baseado em dias consecutivos
    // Nota: O workoutHistory já foi criado acima, então o calculateStreak
    // já vai incluir o dia de hoje automaticamente
    const currentStreak = await calculateStreak(studentId);

    // Atualizar StudentProgress
    const progress = await db.studentProgress.findUnique({
      where: { studentId: studentId },
    });

    if (progress) {
      const longestStreak = Math.max(
        currentStreak,
        progress.longestStreak || 0,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.studentProgress.update({
        where: { studentId: studentId },
        data: {
          totalXP: progress.totalXP + (workout.xpReward || 0),
          currentStreak: currentStreak,
          longestStreak: longestStreak,
          workoutsCompleted: progress.workoutsCompleted + 1,
          lastActivityDate: today,
        },
      });
    }

    // Limpar progresso parcial do workout (já foi salvo como completo)
    // Fazer de forma não-bloqueante - ignorar erros 404 (progresso pode não existir)
    try {
      await db.workoutProgress.delete({
        where: {
          studentId_workoutId: {
            studentId: studentId,
            workoutId: workoutId,
          },
        },
      });
    } catch (error) {
      // Ignorar erro se progresso não existir (P2025 = Record not found)
      const err = error as { code?: string };
      if (err.code !== "P2025") {
        console.error(
          "[completeWorkoutHandler] Erro ao limpar progresso:",
          error,
        );
        // Não falhar a requisição por causa disso
      }
    }

    return successResponse({
      workoutHistoryId: workoutHistory.id,
      xpEarned: workout.xpReward || 0,
    });
  } catch (error) {
    console.error("[completeWorkoutHandler] Erro:", error);
    return internalErrorResponse("Erro ao completar workout", error);
  }
}

/**
 * POST /api/workouts/[id]/progress
 * Salva progresso parcial de um workout
 */
export async function saveWorkoutProgressHandler(
  request: NextRequest,
  workoutId: string,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student!.id;

    if (!workoutId) {
      return badRequestResponse("ID do workout não fornecido");
    }

    // Validar body com Zod
    const validation = await validateBody<
      z.infer<typeof saveWorkoutProgressSchema>
    >(request, saveWorkoutProgressSchema);
    if (!validation.success) {
      return validation.response;
    }

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
    } = validation.data;

    // Verificar se o workout existe
    const workout = await db.workout.findUnique({
      where: { id: workoutId },
    });

    if (!workout) {
      return notFoundResponse("Workout não encontrado");
    }

    // Upsert progress
    await db.workoutProgress.upsert({
      where: {
        studentId_workoutId: {
          studentId: studentId,
          workoutId: workoutId,
        },
      },
      create: {
        studentId: studentId,
        workoutId: workoutId,
        currentExerciseIndex: currentExerciseIndex,
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
      },
      update: {
        currentExerciseIndex: currentExerciseIndex,
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
        cardioPreference: cardioPreference || null,
        cardioDuration: cardioDuration || null,
        selectedCardioType: selectedCardioType || null,
      },
    });

    return successResponse({ message: "Progresso salvo com sucesso" });
  } catch (error) {
    console.error("[saveWorkoutProgressHandler] Erro:", error);
    const err = error as { message?: string; code?: string };

    // Verificar se a tabela não existe
    if (
      err.message?.includes("does not exist") ||
      err.message?.includes("Unknown table") ||
      err.code === "P2021"
    ) {
      return NextResponse.json(
        {
          error: "Tabela workout_progress não existe",
          code: "MIGRATION_REQUIRED",
          message:
            "Execute a migration: node scripts/migration/apply-workout-progress-migration.js",
        },
        { status: 503 }, // Service Unavailable
      );
    }

    // Verificar se é erro de Prisma (tabela não encontrada)
    if (err.code === "P2021" || err.code === "P1001") {
      return NextResponse.json(
        {
          error: "Erro de conexão com banco de dados",
          code: "DATABASE_ERROR",
        },
        { status: 503 },
      );
    }

    return internalErrorResponse("Erro ao salvar progresso", error);
  }
}

/**
 * GET /api/workouts/[id]/progress
 * Busca progresso parcial de um workout
 */
export async function getWorkoutProgressHandler(
  request: NextRequest,
  workoutId: string,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student!.id;

    if (!workoutId) {
      return badRequestResponse("ID do workout não fornecido");
    }

    const progress = await db.workoutProgress.findUnique({
      where: {
        studentId_workoutId: {
          studentId,
          workoutId,
        },
      },
    });

    if (!progress) {
      return successResponse({
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

    return successResponse({
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
  } catch (error) {
    console.error("[getWorkoutProgressHandler] Erro:", error);
    const err = error as { message?: string };
    // Se a tabela não existir, retornar null sem erro
    if (
      err.message?.includes("does not exist") ||
      err.message?.includes("workout_progress")
    ) {
      return successResponse({
        progress: null,
        message:
          "Tabela workout_progress não existe. Execute: node scripts/migration/apply-workout-progress-migration.js",
      });
    }
    return internalErrorResponse("Erro ao buscar progresso", error);
  }
}

/**
 * DELETE /api/workouts/[id]/progress
 * Deleta progresso parcial de um workout
 * Operação idempotente: se o progresso não existir, retorna sucesso
 */
export async function deleteWorkoutProgressHandler(
  request: NextRequest,
  workoutId: string,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student!.id;

    if (!workoutId) {
      return badRequestResponse("ID do workout não fornecido");
    }

    // Verificar se o progresso existe antes de deletar (idempotência)
    const existingProgress = await db.workoutProgress.findUnique({
      where: {
        studentId_workoutId: {
          studentId,
          workoutId,
        },
      },
    });

    // Se não existe, retornar sucesso (operção idempotente)
    if (!existingProgress) {
      return successResponse({
        message: "Progresso não encontrado (já estava deletado)",
      });
    }

    await db.workoutProgress.delete({
      where: {
        studentId_workoutId: {
          studentId,
          workoutId,
        },
      },
    });

    return successResponse({ message: "Progresso deletado com sucesso" });
  } catch (error) {
    console.error("[deleteWorkoutProgressHandler] Erro:", error);
    const err = error as { code?: string };
    // Se o erro for P2025 (record not found), tratar como sucesso (idempotência)
    if (err.code === "P2025") {
      return successResponse({
        message: "Progresso não encontrado (já estava deletado)",
      });
    }
    return internalErrorResponse("Erro ao deletar progresso", error);
  }
}

/**
 * GET /api/workouts/history
 * Busca histórico de workouts
 */
export async function getWorkoutHistoryHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student!.id;

    // Validar query params com Zod
    const queryValidation = await validateQuery<
      z.infer<typeof workoutHistoryQuerySchema>
    >(request, workoutHistoryQuerySchema);
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const limit = queryValidation.data.limit || 10;
    const offset = queryValidation.data.offset || 0;

    // Buscar histórico
    const workoutHistory = await db.workoutHistory.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            type: true,
            muscleGroup: true,
          },
        },
        exercises: {
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transformar para formato esperado
    const formattedHistory = workoutHistory.map((wh) => {
      // Calcular volume total
      let calculatedVolume = 0;
      if (wh.exercises && wh.exercises.length > 0) {
        calculatedVolume = wh.exercises.reduce((acc, el) => {
          try {
            const sets = JSON.parse(el.sets);
            if (Array.isArray(sets)) {
              return (
                acc +
                sets.reduce((setAcc: number, set: { weight?: number; reps?: number; completed?: boolean }) => {
                  if (set.weight && set.reps && (set.completed ?? true)) {
                    return setAcc + set.weight * set.reps;
                  }
                  return setAcc;
                }, 0)
              );
            }
          } catch (_e) {
            // Ignorar erro de parse
          }
          return acc;
        }, 0);
      }

      // Parse bodyPartsFatigued
      let bodyPartsFatigued: string[] = [];
      if (wh.bodyPartsFatigued) {
        try {
          bodyPartsFatigued = JSON.parse(wh.bodyPartsFatigued);
        } catch (_e) {
          // Ignorar erro de parse
        }
      }

      return {
        date: wh.date,
        workoutId: wh.workoutId,
        workoutName: wh.workout?.title ?? "",
        duration: wh.duration,
        totalVolume: wh.totalVolume || calculatedVolume,
        exercises: wh.exercises.map((el) => {
          let sets: Array<{ weight?: number; reps?: number; completed?: boolean }> = [];
          try {
            sets = JSON.parse(el.sets);
          } catch (_e) {
            // Ignorar erro de parse
          }

          return {
            id: el.id,
            exerciseId: el.exerciseId,
            exerciseName: el.exerciseName,
            workoutId: wh.workoutId,
            date: wh.date,
            sets: sets,
            notes: el.notes || undefined,
            formCheckScore: el.formCheckScore || undefined,
            difficulty: el.difficulty || undefined,
          };
        }),
        overallFeedback:
          (wh.overallFeedback as "excelente" | "bom" | "regular" | "ruim") ||
          undefined,
        bodyPartsFatigued: bodyPartsFatigued,
      };
    });

    // Contar total
    const total = await db.workoutHistory.count({
      where: {
        studentId: studentId,
      },
    });

    return successResponse({
      history: formattedHistory,
      total: total,
      limit: limit,
      offset: offset,
    });
  } catch (error) {
    console.error("[getWorkoutHistoryHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar histórico", error);
  }
}

/**
 * PUT /api/workouts/history/[historyId]/exercises/[exerciseId]
 * Atualiza um exercício específico em um workout já completado
 */
export async function updateExerciseLogHandler(
  request: NextRequest,
  historyId: string,
  exerciseId: string,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student!.id;

    if (!historyId || !exerciseId) {
      return badRequestResponse("historyId e exerciseId são obrigatórios");
    }

    // Verificar se o workout history pertence ao student
    const workoutHistory = await db.workoutHistory.findUnique({
      where: { id: historyId },
      include: {
        exercises: true,
      },
    });

    if (!workoutHistory) {
      return notFoundResponse("Histórico de workout não encontrado");
    }

    if (workoutHistory.studentId !== studentId) {
      return badRequestResponse(
        "Você não tem permissão para atualizar este workout",
      );
    }

    // Verificar se o exercício existe no histórico
    const exerciseLog = workoutHistory.exercises.find(
      (ex) => ex.id === exerciseId,
    );

    if (!exerciseLog) {
      return notFoundResponse("Exercício não encontrado neste workout");
    }

    // Validar body com Zod
    const validation = await validateBody<
      z.infer<typeof updateExerciseLogSchema>
    >(request, updateExerciseLogSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { sets, notes, formCheckScore, difficulty } = validation.data;

    // Preparar dados para atualização
    const updateData: {
      sets?: string;
      notes?: string | null;
      formCheckScore?: number | null;
      difficulty?: string | null;
    } = {};

    if (sets !== undefined) {
      updateData.sets = JSON.stringify(sets);
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    if (formCheckScore !== undefined) {
      updateData.formCheckScore =
        formCheckScore !== null && formCheckScore !== undefined
          ? formCheckScore
          : null;
    }

    if (difficulty !== undefined) {
      updateData.difficulty = difficulty || null;
    }

    // Atualizar o exercício
    const updatedExerciseLog = await db.exerciseLog.update({
      where: { id: exerciseId },
      data: updateData,
    });

    // Recalcular volume total do workout history
    const allExercises = await db.exerciseLog.findMany({
      where: { workoutHistoryId: historyId },
    });

    let newTotalVolume = 0;
    for (const ex of allExercises) {
      try {
        const exerciseSets = JSON.parse(ex.sets);
        if (Array.isArray(exerciseSets)) {
          const exerciseVolume = exerciseSets.reduce(
            (acc: number, set: { weight?: number; reps?: number; completed?: boolean }) => {
              if (set.weight && set.reps && (set.completed ?? true)) {
                return acc + set.weight * set.reps;
              }
              return acc;
            },
            0,
          );
          newTotalVolume += exerciseVolume;
        }
      } catch (_e) {
        // Ignorar erro de parse
      }
    }

    // Atualizar volume total no workout history
    await db.workoutHistory.update({
      where: { id: historyId },
      data: { totalVolume: newTotalVolume },
    });

    // Parsear sets para retornar
    let parsedSets: Array<{ weight?: number; reps?: number; completed?: boolean }> = [];
    try {
      parsedSets = JSON.parse(updatedExerciseLog.sets);
    } catch (_e) {
      // Ignorar erro de parse
    }

    return successResponse({
      exerciseLog: {
        id: updatedExerciseLog.id,
        exerciseId: updatedExerciseLog.exerciseId,
        exerciseName: updatedExerciseLog.exerciseName,
        sets: parsedSets,
        notes: updatedExerciseLog.notes || undefined,
        formCheckScore: updatedExerciseLog.formCheckScore || undefined,
        difficulty: updatedExerciseLog.difficulty || undefined,
      },
      totalVolume: newTotalVolume,
    });
  } catch (error) {
    console.error("[updateExerciseLogHandler] Erro:", error);
    const err = error as { code?: string };
    if (err.code === "P2025") {
      return notFoundResponse("Exercício não encontrado");
    }
    return internalErrorResponse("Erro ao atualizar exercício", error);
  }
}

/**
 * PUT /api/workouts/[id]/progress/exercises/[exerciseId]
 * Atualiza um exercício específico no progresso atual de um workout
 */
export async function updateWorkoutProgressExerciseHandler(
  request: NextRequest,
  workoutId: string,
  exerciseId: string,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student!.id;

    if (!workoutId || !exerciseId) {
      return badRequestResponse("workoutId e exerciseId são obrigatórios");
    }

    // Buscar progresso atual
    const progress = await db.workoutProgress.findUnique({
      where: {
        studentId_workoutId: {
          studentId: studentId,
          workoutId: workoutId,
        },
      },
    });

    if (!progress) {
      return notFoundResponse("Progresso do workout não encontrado");
    }

    // Validar body com Zod
    const validation = await validateBody<
      z.infer<typeof updateExerciseLogSchema>
    >(request, updateExerciseLogSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { sets, notes, formCheckScore, difficulty } = validation.data;

    // Parsear exerciseLogs atual
    type ExerciseLogItem = {
      id?: string;
      exerciseId: string;
      sets: Array<{ weight?: number; reps?: number; completed?: boolean }>;
      notes?: string | null;
      formCheckScore?: number | null;
      difficulty?: string | null;
    };
    let exerciseLogs: ExerciseLogItem[] = [];
    try {
      exerciseLogs = JSON.parse(progress.exerciseLogs || "[]");
    } catch (_e) {
      exerciseLogs = [];
    }

    // Encontrar e atualizar o exercício
    const exerciseIndex = exerciseLogs.findIndex(
      (log) => log.exerciseId === exerciseId || log.id === exerciseId,
    );

    if (exerciseIndex === -1) {
      return notFoundResponse("Exercício não encontrado no progresso");
    }

    // Atualizar dados do exercício (normalizar null para undefined)
    if (sets !== undefined) {
      exerciseLogs[exerciseIndex].sets = sets.map((s) => ({
        weight: s.weight ?? undefined,
        reps: s.reps ?? undefined,
        completed: s.completed,
      }));
    }

    if (notes !== undefined) {
      exerciseLogs[exerciseIndex].notes = notes || null;
    }

    if (formCheckScore !== undefined) {
      exerciseLogs[exerciseIndex].formCheckScore =
        formCheckScore !== null && formCheckScore !== undefined
          ? formCheckScore
          : null;
    }

    if (difficulty !== undefined) {
      exerciseLogs[exerciseIndex].difficulty = difficulty || null;
    }

    // Recalcular volume total
    let newTotalVolume = 0;
    for (const log of exerciseLogs) {
      if (log.sets && Array.isArray(log.sets)) {
        const exerciseVolume = log.sets.reduce((acc: number, set: { weight?: number; reps?: number; completed?: boolean }) => {
          if (set.weight && set.reps && (set.completed ?? true)) {
            return acc + set.weight * set.reps;
          }
          return acc;
        }, 0);
        newTotalVolume += exerciseVolume;
      }
    }

    // Atualizar progresso
    await db.workoutProgress.update({
      where: {
        studentId_workoutId: {
          studentId: studentId,
          workoutId: workoutId,
        },
      },
      data: {
        exerciseLogs: JSON.stringify(exerciseLogs),
        totalVolume: newTotalVolume,
      },
    });

    return successResponse({
      exerciseLog: exerciseLogs[exerciseIndex],
      totalVolume: newTotalVolume,
    });
  } catch (error) {
    console.error("[updateWorkoutProgressExerciseHandler] Erro:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return notFoundResponse("Progresso não encontrado");
    }
    return internalErrorResponse("Erro ao atualizar exercício", error);
  }
}
