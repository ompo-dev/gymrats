/**
 * Use Case: Save Workout Progress
 * Salva/atualiza o progresso parcial de um workout em andamento.
 */

import { db } from "@/lib/db";

export interface SaveWorkoutProgressInput {
  studentId: string;
  workoutId: string;
  currentExerciseIndex: number;
  exerciseLogs?: unknown[];
  skippedExercises?: string[];
  selectedAlternatives?: Record<string, string>;
  xpEarned?: number;
  totalVolume?: number;
  completionPercentage?: number;
  startTime?: string | null;
  cardioPreference?: string | null;
  cardioDuration?: number | null;
  selectedCardioType?: string | null;
}

export async function saveWorkoutProgressUseCase(
  input: SaveWorkoutProgressInput,
): Promise<void> {
  const {
    studentId,
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
  } = input;

  const workout = await db.workout.findUnique({ where: { id: workoutId } });
  if (!workout) throw new Error("Workout não encontrado");

  await db.workoutProgress.upsert({
    where: { studentId_workoutId: { studentId, workoutId } },
    create: {
      studentId,
      workoutId,
      currentExerciseIndex,
      exerciseLogs: JSON.stringify(exerciseLogs ?? []),
      skippedExercises: skippedExercises
        ? JSON.stringify(skippedExercises)
        : null,
      selectedAlternatives: selectedAlternatives
        ? JSON.stringify(selectedAlternatives)
        : null,
      xpEarned: xpEarned ?? 0,
      totalVolume: totalVolume ?? 0,
      completionPercentage: completionPercentage ?? 0,
      startTime: startTime ? new Date(startTime) : new Date(),
      cardioPreference: cardioPreference ?? null,
      cardioDuration: cardioDuration ?? null,
      selectedCardioType: selectedCardioType ?? null,
    },
    update: {
      currentExerciseIndex,
      exerciseLogs: JSON.stringify(exerciseLogs ?? []),
      skippedExercises: skippedExercises
        ? JSON.stringify(skippedExercises)
        : null,
      selectedAlternatives: selectedAlternatives
        ? JSON.stringify(selectedAlternatives)
        : null,
      xpEarned: xpEarned ?? 0,
      totalVolume: totalVolume ?? 0,
      completionPercentage: completionPercentage ?? 0,
      cardioPreference: cardioPreference ?? null,
      cardioDuration: cardioDuration ?? null,
      selectedCardioType: selectedCardioType ?? null,
    },
  });
}
