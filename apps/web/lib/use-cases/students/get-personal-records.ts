/**
 * Use Case: Get Personal Records
 * Busca os recordes pessoais do student.
 */

import { db } from "@/lib/db";

export interface GetPersonalRecordsInput {
  studentId: string;
  limit?: number;
}

export interface PersonalRecordDTO {
  exerciseId: string;
  exerciseName: string;
  type: "max-weight" | "max-reps" | "max-volume";
  value: number;
  date: Date;
  previousBest?: number;
}

export interface GetPersonalRecordsOutput {
  records: PersonalRecordDTO[];
  total: number;
}

export async function getPersonalRecordsUseCase(
  input: GetPersonalRecordsInput,
): Promise<GetPersonalRecordsOutput> {
  const { studentId, limit = 50 } = input;

  const personalRecords = await db.personalRecord.findMany({
    where: { studentId },
    orderBy: { date: "desc" },
    take: limit,
  });

  const records: PersonalRecordDTO[] = personalRecords.map((pr) => ({
    exerciseId: pr.exerciseId,
    exerciseName: pr.exerciseName,
    type: pr.type as "max-weight" | "max-reps" | "max-volume",
    value: pr.value,
    date: pr.date,
    previousBest: pr.previousBest || undefined,
  }));

  return { records, total: records.length };
}
