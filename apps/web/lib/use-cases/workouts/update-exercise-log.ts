/**
 * Use Case: Update Exercise Log
 * Atualiza um exercício em um workout já completado e recalcula volume total.
 */

import { db } from "@/lib/db";

export interface UpdateExerciseLogInput {
  historyId: string;
  exerciseId: string;
  studentId: string;
  sets?: Array<{ weight?: number; reps?: number; completed?: boolean }>;
  notes?: string | null;
  formCheckScore?: number | null;
  difficulty?: string | null;
}

export interface UpdateExerciseLogOutput {
  exerciseLog: {
    id: string;
    exerciseId: string;
    exerciseName: string;
    sets: Array<{ weight?: number; reps?: number; completed?: boolean }>;
    notes?: string;
    formCheckScore?: number;
    difficulty?: string;
  };
}

export async function updateExerciseLogUseCase(
  input: UpdateExerciseLogInput,
): Promise<UpdateExerciseLogOutput> {
  const {
    historyId,
    exerciseId,
    studentId,
    sets,
    notes,
    formCheckScore,
    difficulty,
  } = input;

  const workoutHistory = await db.workoutHistory.findUnique({
    where: { id: historyId },
    include: { exercises: true },
  });

  if (!workoutHistory) throw new Error("Histórico de workout não encontrado");
  if (workoutHistory.studentId !== studentId)
    throw new Error("Sem permissão para atualizar este workout");

  const exerciseLog = workoutHistory.exercises.find(
    (ex) => ex.id === exerciseId,
  );
  if (!exerciseLog) throw new Error("Exercício não encontrado neste workout");

  const updateData: {
    sets?: string;
    notes?: string | null;
    formCheckScore?: number | null;
    difficulty?: string | null;
  } = {};

  if (sets !== undefined) updateData.sets = JSON.stringify(sets);
  if (notes !== undefined) updateData.notes = notes ?? null;
  if (formCheckScore !== undefined)
    updateData.formCheckScore = formCheckScore ?? null;
  if (difficulty !== undefined) updateData.difficulty = difficulty ?? null;

  const updated = await db.exerciseLog.update({
    where: { id: exerciseId },
    data: updateData,
  });

  // Recalcular volume total
  const allExercises = await db.exerciseLog.findMany({
    where: { workoutHistoryId: historyId },
  });

  let newTotalVolume = 0;
  for (const ex of allExercises) {
    try {
      const exerciseSets = JSON.parse(ex.sets);
      if (Array.isArray(exerciseSets)) {
        newTotalVolume += exerciseSets.reduce(
          (
            acc: number,
            set: { weight?: number; reps?: number; completed?: boolean },
          ) => {
            if (set.weight && set.reps && (set.completed ?? true)) {
              return acc + set.weight * set.reps;
            }
            return acc;
          },
          0,
        );
      }
    } catch {
      // ignorar
    }
  }

  await db.workoutHistory.update({
    where: { id: historyId },
    data: { totalVolume: newTotalVolume },
  });

  let parsedSets: Array<{
    weight?: number;
    reps?: number;
    completed?: boolean;
  }> = [];
  try {
    parsedSets = JSON.parse(updated.sets);
  } catch {
    // ignorar
  }

  return {
    exerciseLog: {
      id: updated.id,
      exerciseId: updated.exerciseId,
      exerciseName: updated.exerciseName,
      sets: parsedSets,
      notes: updated.notes ?? undefined,
      formCheckScore: updated.formCheckScore ?? undefined,
      difficulty: updated.difficulty ?? undefined,
    },
  };
}
