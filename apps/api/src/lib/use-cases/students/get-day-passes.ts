/**
 * Use Case: Get Day Passes
 * Busca os day passes comprados pelo student.
 */

import { db } from "@/lib/db";

export interface GetDayPassesInput {
  studentId: string;
  limit?: number;
}

export interface DayPassDTO {
  id: string;
  gymId: string;
  gymName: string;
  purchaseDate: Date;
  validDate: Date;
  price: number;
  status: string;
  qrCode?: string;
}

export interface GetDayPassesOutput {
  dayPasses: DayPassDTO[];
  total: number;
}

export async function getDayPassesUseCase(
  input: GetDayPassesInput,
): Promise<GetDayPassesOutput> {
  const { studentId, limit = 50 } = input;

  const dayPasses = await db.dayPass.findMany({
    where: { studentId },
    orderBy: { purchaseDate: "desc" },
    take: limit,
  });

  const formatted: DayPassDTO[] = dayPasses.map((dp) => ({
    id: dp.id,
    gymId: dp.gymId,
    gymName: dp.gymName,
    purchaseDate: dp.purchaseDate,
    validDate: dp.validDate,
    price: dp.price,
    status: dp.status,
    qrCode: dp.qrCode || undefined,
  }));

  return { dayPasses: formatted, total: formatted.length };
}
