/**
 * Use Case: Add Weight
 * Adiciona nova entrada de peso e atualiza o peso atual no perfil.
 */

import { db } from "@/lib/db";
import { invalidateWeightHistoryCache } from "./get-weight-history";

export interface AddWeightInput {
  studentId: string;
  weight: number;
  date?: string;
  notes?: string | null;
}

export interface AddWeightOutput {
  weightEntry: {
    id: string;
    weight: number;
    date: Date;
    notes: string | null;
  };
}

export async function addWeightUseCase(
  input: AddWeightInput,
): Promise<AddWeightOutput> {
  const { studentId, weight, date, notes } = input;

  const weightEntry = await db.weightHistory.create({
    data: {
      studentId,
      weight,
      date: date ? new Date(date) : new Date(),
      notes: notes || null,
    },
  });

  // Atualizar peso atual no StudentProfile
  await db.studentProfile.updateMany({
    where: { studentId },
    data: { weight },
  });
  await invalidateWeightHistoryCache(studentId);

  return {
    weightEntry: {
      id: weightEntry.id,
      weight: weightEntry.weight,
      date: weightEntry.date,
      notes: weightEntry.notes,
    },
  };
}
