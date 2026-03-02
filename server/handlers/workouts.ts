import type { Context } from "elysia";
import {
  saveWorkoutProgressSchema,
  updateExerciseLogSchema,
  updateWorkoutProgressExerciseSchema,
} from "@/lib/api/schemas/workouts.schemas";
import type { MuscleGroup } from "@/lib/types";
import { completeWorkoutUseCase } from "@/lib/use-cases/workouts/complete-workout";
import { deleteWorkoutProgressUseCase } from "@/lib/use-cases/workouts/delete-workout-progress";
import { getUnitsUseCase } from "@/lib/use-cases/workouts/get-units";
import { getWorkoutHistoryUseCase } from "@/lib/use-cases/workouts/get-workout-history";
import { getWorkoutProgressUseCase } from "@/lib/use-cases/workouts/get-workout-progress";
import { saveWorkoutProgressUseCase } from "@/lib/use-cases/workouts/save-workout-progress";
import { updateExerciseLogUseCase } from "@/lib/use-cases/workouts/update-exercise-log";
import { parseJsonArray, parseJsonSafe } from "../utils/json";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";

type WorkoutContext = {
  set: Context["set"];
  body?: Record<string, string | number | boolean | object | null>;
  studentId?: string;
  params?: Record<string, string>;
};

export async function getUnitsHandler({ set, studentId }: WorkoutContext) {
  try {
    if (!studentId) return badRequestResponse(set, "Student ID é obrigatório");
    const { units } = await getUnitsUseCase({ studentId });
    return successResponse(set, { units });
  } catch (error) {
    console.error("[getUnitsHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar units", error);
  }
}

export async function completeWorkoutHandler({
  set,
  body,
  studentId,
  params,
}: WorkoutContext) {
  try {
    if (!studentId) return badRequestResponse(set, "Student ID é obrigatório");
    const workoutId = params?.id;
    if (!workoutId) return badRequestResponse(set, "Workout ID é obrigatório");

    const payload = body as Record<
      string,
      string | number | boolean | object | null
    >;
    try {
      const result = await completeWorkoutUseCase({
        studentId,
        workoutId,
        duration: payload?.duration as number | undefined,
        totalVolume: payload?.totalVolume as number | undefined,
        overallFeedback: payload?.overallFeedback as string | null | undefined,
        bodyPartsFatigued: payload?.bodyPartsFatigued as string[] | undefined,
      });
      return successResponse(set, {
        completionId: result.workoutHistoryId,
        message: "Treino completado com sucesso",
      });
    } catch (err) {
      if ((err as Error).message === "Workout não encontrado")
        return notFoundResponse(set, "Treino não encontrado");
      throw err;
    }
  } catch (error) {
    console.error("[completeWorkoutHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao completar treino", error);
  }
}

export async function saveWorkoutProgressHandler({
  set,
  body,
  studentId,
  params,
}: WorkoutContext) {
  try {
    if (!studentId) return badRequestResponse(set, "Student ID é obrigatório");
    const workoutId = params?.id;
    if (!workoutId) return badRequestResponse(set, "Workout ID é obrigatório");

    const validation = validateBody(body, saveWorkoutProgressSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    const data = validation.data as Record<
      string,
      string | number | boolean | object | null | undefined
    >;
    try {
      await saveWorkoutProgressUseCase({
        studentId,
        workoutId,
        currentExerciseIndex: data.currentExerciseIndex as number,
        exerciseLogs: data.exerciseLogs as unknown[],
        skippedExercises: data.skippedExercises as string[] | undefined,
        selectedAlternatives: data.selectedAlternatives as
          | Record<string, string>
          | undefined,
        xpEarned: data.xpEarned as number | undefined,
        totalVolume: data.totalVolume as number | undefined,
        completionPercentage: data.completionPercentage as number | undefined,
        startTime: data.startTime as string | null | undefined,
        cardioPreference: data.cardioPreference as string | null | undefined,
        cardioDuration: data.cardioDuration as number | null | undefined,
        selectedCardioType: data.selectedCardioType as
          | string
          | null
          | undefined,
      });
    } catch (err) {
      if ((err as Error).message === "Workout não encontrado")
        return notFoundResponse(set, "Workout não encontrado");
      throw err;
    }
    return successResponse(set, { message: "Progresso salvo com sucesso" });
  } catch (error) {
    console.error("[saveWorkoutProgressHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao salvar progresso", error);
  }
}

export async function getWorkoutProgressHandler({
  set,
  studentId,
  params,
}: WorkoutContext) {
  try {
    if (!studentId) return badRequestResponse(set, "Student ID é obrigatório");
    const workoutId = params?.id;
    if (!workoutId) return badRequestResponse(set, "Workout ID é obrigatório");

    const { progress } = await getWorkoutProgressUseCase({
      studentId,
      workoutId,
    });
    if (!progress) return notFoundResponse(set, "Progresso não encontrado");

    return successResponse(set, { progress });
  } catch (error) {
    console.error("[getWorkoutProgressHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar progresso", error);
  }
}

export async function deleteWorkoutProgressHandler({
  set,
  studentId,
  params,
}: WorkoutContext) {
  try {
    if (!studentId) return badRequestResponse(set, "Student ID é obrigatório");
    const workoutId = params?.id;
    if (!workoutId) return badRequestResponse(set, "Workout ID é obrigatório");

    await deleteWorkoutProgressUseCase({ studentId, workoutId });
    return successResponse(set, { message: "Progresso deletado com sucesso" });
  } catch (error) {
    console.error("[deleteWorkoutProgressHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao deletar progresso", error);
  }
}

export async function getWorkoutHistoryHandler({
  set,
  studentId,
}: WorkoutContext) {
  try {
    if (!studentId) return badRequestResponse(set, "Student ID é obrigatório");
    const result = await getWorkoutHistoryUseCase({ studentId });
    return successResponse(set, { history: result.history });
  } catch (error) {
    console.error("[getWorkoutHistoryHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar histórico", error);
  }
}

export async function updateExerciseLogHandler({
  set,
  body,
  params,
  studentId,
}: WorkoutContext) {
  try {
    const historyId = params?.historyId;
    const exerciseId = params?.exerciseId;

    if (!historyId || !exerciseId)
      return badRequestResponse(set, "historyId e exerciseId são obrigatórios");

    const validation = validateBody(body, updateExerciseLogSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    const data = validation.data as Record<
      string,
      string | number | boolean | object | null | undefined
    >;
    try {
      const result = await updateExerciseLogUseCase({
        historyId,
        exerciseId,
        studentId: studentId ?? "",
        sets: data.sets as
          | Array<{ weight?: number; reps?: number; completed?: boolean }>
          | undefined,
        notes: data.notes as string | null | undefined,
        formCheckScore: data.formCheckScore as number | null | undefined,
        difficulty: data.difficulty as string | null | undefined,
      });
      return successResponse(set, { exercise: result.exerciseLog });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "Histórico de workout não encontrado")
        return notFoundResponse(set, msg);
      if (msg === "Exercício não encontrado neste workout")
        return notFoundResponse(set, msg);
      if (msg === "Sem permissão para atualizar este workout")
        return badRequestResponse(set, msg);
      throw err;
    }
  } catch (error) {
    console.error("[updateExerciseLogHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao atualizar exercício", error);
  }
}

export async function updateWorkoutProgressExerciseHandler({
  set,
  body,
  studentId,
  params,
}: WorkoutContext) {
  try {
    if (!studentId) return badRequestResponse(set, "Student ID é obrigatório");
    const workoutId = params?.id;
    const exerciseId = params?.exerciseId;

    if (!workoutId || !exerciseId)
      return badRequestResponse(set, "Workout e exerciseId são obrigatórios");

    const validation = validateBody(body, updateWorkoutProgressExerciseSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    const { progress: current } = await getWorkoutProgressUseCase({
      studentId,
      workoutId,
    });
    if (!current) return notFoundResponse(set, "Progresso não encontrado");

    const updatePayload = validation.data as Record<
      string,
      import("@/lib/types/api-error").JsonValue
    >;
    const updatedLogs = current.exerciseLogs.map((log) => {
      const l = log as { exerciseId: string };
      return l.exerciseId === exerciseId ? { ...l, ...updatePayload } : l;
    });

    await saveWorkoutProgressUseCase({
      studentId,
      workoutId,
      currentExerciseIndex: current.currentExerciseIndex,
      exerciseLogs: updatedLogs,
      skippedExercises: current.skippedExercises,
      selectedAlternatives: current.selectedAlternatives,
      xpEarned: current.xpEarned,
      totalVolume: current.totalVolume,
      completionPercentage: current.completionPercentage,
      cardioPreference: current.cardioPreference,
      cardioDuration: current.cardioDuration,
      selectedCardioType: current.selectedCardioType,
    });

    return successResponse(set, {
      progress: { ...current, exerciseLogs: updatedLogs },
    });
  } catch (error) {
    console.error("[updateWorkoutProgressExerciseHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao atualizar exercício", error);
  }
}
