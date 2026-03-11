/**
 * Use Case: Complete Workout
 * Finaliza um workout, criando WorkoutHistory, ExerciseLogs e atualizando StudentProgress.
 */

import { db } from "@/lib/db";
import { calculateStreak } from "./streak";

export interface ExerciseLogInput {
  exerciseId: string;
  exerciseName: string;
  sets?: Array<{
    weight?: number | null;
    reps?: number | null;
    completed?: boolean;
  }>;
  notes?: string | null;
  formCheckScore?: number | null;
  difficulty?: string | null;
}

export interface CompleteWorkoutInput {
  studentId: string;
  workoutId: string;
  duration?: number | null;
  totalVolume?: number;
  overallFeedback?: string | null;
  bodyPartsFatigued?: string[];
  startTime?: string | null;
  exerciseLogs?: ExerciseLogInput[];
}

export interface CompleteWorkoutOutput {
  workoutHistoryId: string;
  xpEarned: number;
}

export async function completeWorkoutUseCase(
  input: CompleteWorkoutInput,
): Promise<CompleteWorkoutOutput> {
  const {
    studentId,
    workoutId,
    duration,
    totalVolume,
    overallFeedback,
    bodyPartsFatigued,
    startTime,
    exerciseLogs,
  } = input;

  const workout = await db.workout.findUnique({ where: { id: workoutId } });
  if (!workout) throw new Error("Workout não encontrado");

  const workoutDuration =
    duration !== undefined && duration !== null
      ? duration
      : startTime
        ? Math.round((Date.now() - new Date(startTime).getTime()) / 60000)
        : workout.estimatedTime;

  const workoutHistory = await db.workoutHistory.create({
    data: {
      studentId,
      workoutId,
      date: new Date(),
      duration: workoutDuration,
      totalVolume: totalVolume ?? 0,
      overallFeedback: overallFeedback ?? "regular",
      bodyPartsFatigued: bodyPartsFatigued
        ? JSON.stringify(bodyPartsFatigued)
        : null,
    },
  });

  if (exerciseLogs && Array.isArray(exerciseLogs)) {
    for (const log of exerciseLogs) {
      await db.exerciseLog.create({
        data: {
          workoutHistoryId: workoutHistory.id,
          exerciseId: log.exerciseId,
          exerciseName: log.exerciseName,
          sets: JSON.stringify(log.sets ?? []),
          notes: log.notes ?? null,
          formCheckScore: log.formCheckScore ?? null,
          difficulty: log.difficulty ?? null,
        },
      });
    }
  }

  const currentStreak = await calculateStreak(studentId);

  const progress = await db.studentProgress.findUnique({
    where: { studentId },
  });

  if (progress) {
    const longestStreak = Math.max(currentStreak, progress.longestStreak ?? 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.studentProgress.update({
      where: { studentId },
      data: {
        totalXP: progress.totalXP + (workout.xpReward ?? 0),
        currentStreak,
        longestStreak,
        workoutsCompleted: progress.workoutsCompleted + 1,
        lastActivityDate: today,
      },
    });
  }

  // Limpar progresso parcial (idempotente)
  try {
    await db.workoutProgress.delete({
      where: { studentId_workoutId: { studentId, workoutId } },
    });
  } catch {
    // ignorar P2025 (progresso não existia)
  }

  return {
    workoutHistoryId: workoutHistory.id,
    xpEarned: workout.xpReward ?? 0,
  };
}
