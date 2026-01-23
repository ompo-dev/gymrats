import { db } from "@/lib/db";
import type { MuscleGroup } from "@/lib/types";
import {
  saveWorkoutProgressSchema,
  updateExerciseLogSchema,
  updateWorkoutProgressExerciseSchema,
} from "@gymrats/contracts";
import type { Context } from "elysia";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody } from "../utils/validation";

type WorkoutContext = {
  set: Context["set"];
  body?: unknown;
  studentId?: string;
  params?: Record<string, string>;
};

export async function getUnitsHandler({ set, studentId }: WorkoutContext) {
  try {
    if (!studentId) {
      return badRequestResponse(set, "Student ID é obrigatório");
    }
    const units = await db.unit.findMany({
      orderBy: { order: "asc" },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
              include: {
                alternatives: {
                  orderBy: { order: "asc" },
                },
              },
            },
            completions: {
              where: { studentId },
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const completedWorkoutIds = await db.workoutHistory.findMany({
      where: { studentId },
      select: { workoutId: true },
      distinct: ["workoutId"],
    });
    const completedIdsSet = new Set(
      completedWorkoutIds.map((wh) => wh.workoutId)
    );

    const data = units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description || "",
      color: unit.color || "#58CC02",
      icon: unit.icon || "💪",
      workouts: unit.workouts.map((workout) => {
        const isCompleted = completedIdsSet.has(workout.id);
        const lastCompletion = workout.completions[0];

        let isLocked = workout.locked;
        const workoutIndex = unit.workouts.findIndex((w) => w.id === workout.id);
        const unitIndex = units.findIndex((u) => u.id === unit.id);

        if (unitIndex === 0 && workoutIndex === 0) {
          isLocked = false;
        } else if (!isLocked) {
          if (unitIndex > 0 || workoutIndex > 0) {
            let previousWorkout = null;
            if (workoutIndex > 0) {
              previousWorkout = unit.workouts[workoutIndex - 1];
            } else if (unitIndex > 0) {
              const previousUnit = units[unitIndex - 1];
              if (previousUnit.workouts.length > 0) {
                previousWorkout =
                  previousUnit.workouts[previousUnit.workouts.length - 1];
              }
            }
            if (previousWorkout) {
              isLocked = !completedIdsSet.has(previousWorkout.id);
            }
          }
        }

        let stars: number | undefined = undefined;
        if (lastCompletion) {
          if (lastCompletion.overallFeedback === "excelente") {
            stars = 3;
          } else if (lastCompletion.overallFeedback === "bom") {
            stars = 2;
          } else if (lastCompletion.overallFeedback === "regular") {
            stars = 1;
          } else {
            stars = 0;
          }
        }

        return {
          id: workout.id,
          title: workout.title,
          description: workout.description || "",
          type: workout.type as
            | "strength"
            | "cardio"
            | "flexibility"
            | "rest",
          muscleGroup: workout.muscleGroup as MuscleGroup,
          difficulty: workout.difficulty as
            | "iniciante"
            | "intermediario"
            | "avancado",
          exercises: workout.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            rest: exercise.rest,
            notes: exercise.notes || undefined,
            videoUrl: exercise.videoUrl || undefined,
            educationalId: exercise.educationalId || undefined,
            alternatives:
              exercise.alternatives.length > 0
                ? exercise.alternatives.map((alt) => ({
                    id: alt.id,
                    name: alt.name,
                    reason: alt.reason,
                    educationalId: alt.educationalId || undefined,
                  }))
                : undefined,
          })),
          xpReward: workout.xpReward,
          estimatedTime: workout.estimatedTime,
          locked: isLocked,
          completed: isCompleted,
          stars,
          completedAt: lastCompletion?.date || undefined,
        };
      }),
    }));

    return successResponse(set, { units: data });
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
    if (!studentId) {
      return badRequestResponse(set, "Student ID é obrigatório");
    }
    const workoutId = params?.id;
    if (!workoutId) {
      return badRequestResponse(set, "Workout ID é obrigatório");
    }

    const workout = await db.workout.findUnique({ where: { id: workoutId } });
    if (!workout) return notFoundResponse(set, "Treino não encontrado");

    const payload = body as any;
    const completion = await db.workoutHistory.create({
      data: {
        studentId,
        workoutId,
        duration: payload?.duration || workout.estimatedTime || 30,
        totalVolume: payload?.totalVolume || null,
        overallFeedback: payload?.overallFeedback || null,
        bodyPartsFatigued: payload?.bodyPartsFatigued
          ? JSON.stringify(payload.bodyPartsFatigued)
          : null,
      },
    });

    await db.studentProgress.upsert({
      where: { studentId },
      create: {
        studentId,
        workoutsCompleted: 1,
        totalXP: workout.xpReward,
        todayXP: workout.xpReward,
        lastActivityDate: new Date(),
      },
      update: {
        workoutsCompleted: { increment: 1 },
        totalXP: { increment: workout.xpReward },
        todayXP: { increment: workout.xpReward },
        lastActivityDate: new Date(),
      },
    });

    return successResponse(set, {
      completionId: completion.id,
      message: "Treino completado com sucesso",
    });
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
    if (!studentId) {
      return badRequestResponse(set, "Student ID é obrigatório");
    }
    const workoutId = params?.id;
    if (!workoutId) {
      return badRequestResponse(set, "Workout ID é obrigatório");
    }

    const validation = validateBody(body, saveWorkoutProgressSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const data = validation.data as any;
    const progress = await db.workoutProgress.upsert({
      where: { studentId_workoutId: { studentId, workoutId } },
      create: {
        studentId,
        workoutId,
        currentExerciseIndex: data.currentExerciseIndex,
        exerciseLogs: JSON.stringify(data.exerciseLogs),
        skippedExercises: data.skippedExercises
          ? JSON.stringify(data.skippedExercises)
          : null,
        selectedAlternatives: data.selectedAlternatives
          ? JSON.stringify(data.selectedAlternatives)
          : null,
        xpEarned: data.xpEarned || 0,
        totalVolume: data.totalVolume || 0,
        completionPercentage: data.completionPercentage || 0,
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        cardioPreference: data.cardioPreference || null,
        cardioDuration: data.cardioDuration || null,
        selectedCardioType: data.selectedCardioType || null,
      },
      update: {
        currentExerciseIndex: data.currentExerciseIndex,
        exerciseLogs: JSON.stringify(data.exerciseLogs),
        skippedExercises: data.skippedExercises
          ? JSON.stringify(data.skippedExercises)
          : null,
        selectedAlternatives: data.selectedAlternatives
          ? JSON.stringify(data.selectedAlternatives)
          : null,
        xpEarned: data.xpEarned || 0,
        totalVolume: data.totalVolume || 0,
        completionPercentage: data.completionPercentage || 0,
        cardioPreference: data.cardioPreference || null,
        cardioDuration: data.cardioDuration || null,
        selectedCardioType: data.selectedCardioType || null,
      },
    });

    return successResponse(set, { progress });
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
    if (!studentId) {
      return badRequestResponse(set, "Student ID é obrigatório");
    }
    const workoutId = params?.id;
    if (!workoutId) {
      return badRequestResponse(set, "Workout ID é obrigatório");
    }

    const progress = await db.workoutProgress.findUnique({
      where: { studentId_workoutId: { studentId, workoutId } },
    });

    if (!progress) {
      return notFoundResponse(set, "Progresso não encontrado");
    }

    return successResponse(set, {
      progress: {
        ...progress,
        exerciseLogs: progress.exerciseLogs
          ? JSON.parse(progress.exerciseLogs)
          : [],
        skippedExercises: progress.skippedExercises
          ? JSON.parse(progress.skippedExercises)
          : [],
        selectedAlternatives: progress.selectedAlternatives
          ? JSON.parse(progress.selectedAlternatives)
          : {},
      },
    });
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
    if (!studentId) {
      return badRequestResponse(set, "Student ID é obrigatório");
    }
    const workoutId = params?.id;
    if (!workoutId) {
      return badRequestResponse(set, "Workout ID é obrigatório");
    }

    await db.workoutProgress.delete({
      where: { studentId_workoutId: { studentId, workoutId } },
    });

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
    if (!studentId) {
      return badRequestResponse(set, "Student ID é obrigatório");
    }
    const workoutHistory = await db.workoutHistory.findMany({
      where: { studentId },
      include: {
        workout: { select: { id: true, title: true } },
        exercises: { orderBy: { id: "asc" } },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    const formatted = workoutHistory.map((wh) => ({
      date: wh.date,
      workoutId: wh.workoutId,
      workoutName: wh.workout?.title || "",
      duration: wh.duration,
      totalVolume: wh.totalVolume || 0,
      exercises: wh.exercises.map((el) => ({
        id: el.id,
        exerciseId: el.exerciseId,
        exerciseName: el.exerciseName,
        workoutId: wh.workoutId,
        date: wh.date,
        sets: (() => {
          try {
            return JSON.parse(el.sets);
          } catch {
            return [];
          }
        })(),
        notes: el.notes || undefined,
        formCheckScore: el.formCheckScore || undefined,
        difficulty: el.difficulty || "ideal",
      })),
      overallFeedback: wh.overallFeedback || undefined,
      bodyPartsFatigued: wh.bodyPartsFatigued
        ? JSON.parse(wh.bodyPartsFatigued)
        : [],
    }));

    return successResponse(set, { history: formatted });
  } catch (error) {
    console.error("[getWorkoutHistoryHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar histórico", error);
  }
}

export async function updateExerciseLogHandler({ set, body, params }: WorkoutContext) {
  try {
    const historyId = params?.historyId;
    const exerciseId = params?.exerciseId;

    if (!historyId || !exerciseId) {
      return badRequestResponse(set, "historyId e exerciseId são obrigatórios");
    }

    const validation = validateBody(body, updateExerciseLogSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const data = validation.data as any;
    const exercise = await db.exerciseLog.findFirst({
      where: { workoutHistoryId: historyId, exerciseId },
    });

    if (!exercise) {
      return notFoundResponse(set, "Exercício não encontrado no histórico");
    }

    const updated = await db.exerciseLog.update({
      where: { id: exercise.id },
      data: {
        ...data,
        sets: data.sets ? JSON.stringify(data.sets) : exercise.sets,
      },
    });

    return successResponse(set, { exercise: updated });
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
    if (!studentId) {
      return badRequestResponse(set, "Student ID é obrigatório");
    }
    const workoutId = params?.id;
    const exerciseId = params?.exerciseId;

    if (!workoutId || !exerciseId) {
      return badRequestResponse(set, "Workout e exerciseId são obrigatórios");
    }

    const validation = validateBody(body, updateWorkoutProgressExerciseSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const progress = await db.workoutProgress.findUnique({
      where: { studentId_workoutId: { studentId, workoutId } },
    });

    if (!progress) {
      return notFoundResponse(set, "Progresso não encontrado");
    }

    const exerciseLogs = progress.exerciseLogs
      ? JSON.parse(progress.exerciseLogs)
      : [];

    const updatePayload = validation.data as Record<string, unknown>;
    const updatedLogs = exerciseLogs.map((log: any) =>
      log.exerciseId === exerciseId ? { ...log, ...updatePayload } : log
    );

    const updated = await db.workoutProgress.update({
      where: { studentId_workoutId: { studentId, workoutId } },
      data: {
        exerciseLogs: JSON.stringify(updatedLogs),
      },
    });

    return successResponse(set, { progress: updated });
  } catch (error) {
    console.error("[updateWorkoutProgressExerciseHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao atualizar exercício", error);
  }
}
