/**
 * Handler de Workouts
 *
 * Centraliza toda a lógica das rotas relacionadas a workouts
 */

import type { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { db } from "@/lib/db";
import { completeWorkoutUseCase } from "@/lib/use-cases/workouts/complete-workout";
import { deleteWorkoutProgressUseCase } from "@/lib/use-cases/workouts/delete-workout-progress";
import { getUnitsUseCase } from "@/lib/use-cases/workouts/get-units";
import { getWeeklyPlanUseCase } from "@/lib/use-cases/workouts/get-weekly-plan";
import { getWorkoutHistoryUseCase } from "@/lib/use-cases/workouts/get-workout-history";
import { getWorkoutProgressUseCase } from "@/lib/use-cases/workouts/get-workout-progress";
import { saveWorkoutProgressUseCase } from "@/lib/use-cases/workouts/save-workout-progress";
import { updateExerciseLogUseCase } from "@/lib/use-cases/workouts/update-exercise-log";
import { requireStudent } from "../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware";
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
      studentId: auth.user.student?.id,
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
      where: { id: auth.user.student?.id },
      select: { weekOverride: true },
    });

    const result = await getWeeklyPlanUseCase({
      studentId: auth.user.student?.id,
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
    if ("error" in auth) return auth.response;

    if (!workoutId) return badRequestResponse("ID do workout não fornecido");

    const validation = await validateBody<
      z.infer<typeof completeWorkoutSchema>
    >(request, completeWorkoutSchema);
    if (!validation.success) return validation.response;

    const {
      exerciseLogs,
      duration,
      totalVolume,
      overallFeedback,
      bodyPartsFatigued,
      startTime,
    } = validation.data;

    try {
      const result = await completeWorkoutUseCase({
        studentId: auth.user.student?.id,
        workoutId,
        duration,
        totalVolume,
        overallFeedback,
        bodyPartsFatigued,
        startTime,
        exerciseLogs:
          exerciseLogs as unknown as import("@/lib/use-cases/workouts/complete-workout").ExerciseLogInput[],
      });

      return successResponse({
        workoutHistoryId: result.workoutHistoryId,
        xpEarned: result.xpEarned,
      });
    } catch (err) {
      if ((err as Error).message === "Workout não encontrado")
        return notFoundResponse("Workout não encontrado");
      throw err;
    }
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
    if ("error" in auth) return auth.response;

    if (!workoutId) return badRequestResponse("ID do workout não fornecido");

    const validation = await validateBody<
      z.infer<typeof saveWorkoutProgressSchema>
    >(request, saveWorkoutProgressSchema);
    if (!validation.success) return validation.response;

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

    try {
      await saveWorkoutProgressUseCase({
        studentId: auth.user.student?.id,
        workoutId,
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
      });
    } catch (err) {
      if ((err as Error).message === "Workout não encontrado")
        return notFoundResponse("Workout não encontrado");
      throw err;
    }

    return successResponse({ message: "Progresso salvo com sucesso" });
  } catch (error) {
    console.error("[saveWorkoutProgressHandler] Erro:", error);
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
    if ("error" in auth) return auth.response;

    if (!workoutId) return badRequestResponse("ID do workout não fornecido");

    const { progress } = await getWorkoutProgressUseCase({
      studentId: auth.user.student?.id,
      workoutId,
    });

    if (!progress) {
      return successResponse({
        progress: null,
        message: "Nenhum progresso encontrado",
      });
    }

    return successResponse({ progress });
  } catch (error) {
    console.error("[getWorkoutProgressHandler] Erro:", error);
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
    if ("error" in auth) return auth.response;

    if (!workoutId) return badRequestResponse("ID do workout não fornecido");

    await deleteWorkoutProgressUseCase({
      studentId: auth.user.student?.id,
      workoutId,
    });

    return successResponse({ message: "Progresso deletado com sucesso" });
  } catch (error) {
    console.error("[deleteWorkoutProgressHandler] Erro:", error);
    const err = error as { code?: string };
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
    if ("error" in auth) return auth.response;

    const queryValidation = await validateQuery<
      z.infer<typeof workoutHistoryQuerySchema>
    >(request, workoutHistoryQuerySchema);
    if (!queryValidation.success) return queryValidation.response;

    const result = await getWorkoutHistoryUseCase({
      studentId: auth.user.student?.id,
      limit: queryValidation.data.limit || 10,
      offset: queryValidation.data.offset || 0,
    });

    return successResponse({
      history: result.history,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
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
    if ("error" in auth) return auth.response;

    if (!historyId || !exerciseId)
      return badRequestResponse("historyId e exerciseId são obrigatórios");

    const validation = await validateBody<
      z.infer<typeof updateExerciseLogSchema>
    >(request, updateExerciseLogSchema);
    if (!validation.success) return validation.response;

    const { sets, notes, formCheckScore, difficulty } = validation.data;

    try {
      const result = await updateExerciseLogUseCase({
        historyId,
        exerciseId,
        studentId: auth.user.student?.id,
        sets: sets as unknown as import("@/lib/use-cases/workouts/update-exercise-log").UpdateExerciseLogInput["sets"],
        notes,
        formCheckScore,
        difficulty,
      });

      return successResponse({ exerciseLog: result.exerciseLog });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "Histórico de workout não encontrado")
        return notFoundResponse(msg);
      if (msg === "Exercício não encontrado neste workout")
        return notFoundResponse(msg);
      if (msg === "Sem permissão para atualizar este workout")
        return badRequestResponse(msg);
      throw err;
    }
  } catch (error) {
    console.error("[updateExerciseLogHandler] Erro:", error);
    const err = error as { code?: string };
    if (err.code === "P2025")
      return notFoundResponse("Exercício não encontrado");
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
    if ("error" in auth) return auth.response;

    if (!workoutId || !exerciseId)
      return badRequestResponse("workoutId e exerciseId são obrigatórios");

    const { progress: current } = await getWorkoutProgressUseCase({
      studentId: auth.user.student?.id,
      workoutId,
    });

    if (!current)
      return notFoundResponse("Progresso do workout não encontrado");

    const validation = await validateBody<
      z.infer<typeof updateExerciseLogSchema>
    >(request, updateExerciseLogSchema);
    if (!validation.success) return validation.response;

    const { sets, notes, formCheckScore, difficulty } = validation.data;

    type ExerciseLogItem = {
      id?: string;
      exerciseId: string;
      sets: Array<{ weight?: number; reps?: number; completed?: boolean }>;
      notes?: string | null;
      formCheckScore?: number | null;
      difficulty?: string | null;
    };

    const exerciseLogs = current.exerciseLogs as ExerciseLogItem[];
    const exerciseIndex = exerciseLogs.findIndex(
      (log) => log.exerciseId === exerciseId || log.id === exerciseId,
    );

    if (exerciseIndex === -1)
      return notFoundResponse("Exercício não encontrado no progresso");

    if (sets !== undefined)
      exerciseLogs[exerciseIndex].sets = sets.map((s) => ({
        weight: s.weight ?? undefined,
        reps: s.reps ?? undefined,
        completed: s.completed,
      }));
    if (notes !== undefined) exerciseLogs[exerciseIndex].notes = notes || null;
    if (formCheckScore !== undefined)
      exerciseLogs[exerciseIndex].formCheckScore = formCheckScore ?? null;
    if (difficulty !== undefined)
      exerciseLogs[exerciseIndex].difficulty = difficulty || null;

    let newTotalVolume = 0;
    for (const log of exerciseLogs) {
      if (log.sets && Array.isArray(log.sets)) {
        newTotalVolume += log.sets.reduce(
          (
            acc: number,
            set: { weight?: number; reps?: number; completed?: boolean },
          ) => {
            if (set.weight && set.reps && (set.completed ?? true))
              return acc + set.weight * set.reps;
            return acc;
          },
          0,
        );
      }
    }

    await saveWorkoutProgressUseCase({
      studentId: auth.user.student?.id,
      workoutId,
      currentExerciseIndex: current.currentExerciseIndex,
      exerciseLogs,
      skippedExercises: current.skippedExercises,
      selectedAlternatives: current.selectedAlternatives,
      xpEarned: current.xpEarned,
      totalVolume: newTotalVolume,
      completionPercentage: current.completionPercentage,
      cardioPreference: current.cardioPreference,
      cardioDuration: current.cardioDuration,
      selectedCardioType: current.selectedCardioType,
    });

    return successResponse({
      exerciseLog: exerciseLogs[exerciseIndex],
      totalVolume: newTotalVolume,
    });
  } catch (error) {
    console.error("[updateWorkoutProgressExerciseHandler] Erro:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return notFoundResponse("Progresso não encontrado");
    }
    return internalErrorResponse("Erro ao atualizar exercício", error);
  }
}
