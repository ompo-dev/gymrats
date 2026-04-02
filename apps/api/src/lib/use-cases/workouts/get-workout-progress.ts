/**
 * Use Case: Get Workout Progress
 * Busca o progresso parcial salvo de um workout específico.
 */

import { db } from "@/lib/db";
import { parseJsonArray, parseJsonSafe } from "@/lib/utils/json";

export interface GetWorkoutProgressInput {
  studentId: string;
  workoutId: string;
}

export interface WorkoutProgressDTO {
  id: string;
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs: unknown[];
  skippedExercises: string[];
  selectedAlternatives: Record<string, string>;
  xpEarned: number;
  totalVolume: number;
  completionPercentage: number;
  startTime: Date | null;
  cardioPreference: string | null;
  cardioDuration: number | null;
  selectedCardioType: string | null;
  lastUpdated: Date;
}

export interface GetWorkoutProgressOutput {
  progress: WorkoutProgressDTO | null;
}

export async function getWorkoutProgressUseCase(
  input: GetWorkoutProgressInput,
): Promise<GetWorkoutProgressOutput> {
  const { studentId, workoutId } = input;

  const progress = await db.workoutProgress.findUnique({
    where: { studentId_workoutId: { studentId, workoutId } },
  });

  if (!progress) {
    return { progress: null };
  }

  const exerciseLogs = parseJsonArray<unknown>(progress.exerciseLogs);
  const skippedExercises = parseJsonArray<string>(progress.skippedExercises);
  const selectedAlternatives =
    parseJsonSafe<Record<string, string>>(progress.selectedAlternatives) ?? {};

  return {
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
  };
}
