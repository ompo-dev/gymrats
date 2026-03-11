/**
 * Use Case: Delete Workout Progress
 * Remove o progresso parcial de um workout (operação idempotente).
 */

import { db } from "@/lib/db";

export interface DeleteWorkoutProgressInput {
  studentId: string;
  workoutId: string;
}

export async function deleteWorkoutProgressUseCase(
  input: DeleteWorkoutProgressInput,
): Promise<void> {
  const { studentId, workoutId } = input;

  try {
    await db.workoutProgress.delete({
      where: { studentId_workoutId: { studentId, workoutId } },
    });
  } catch (error) {
    const err = error as { code?: string };
    // P2025 = record not found — operação idempotente, ignorar
    if (err.code !== "P2025") throw error;
  }
}
