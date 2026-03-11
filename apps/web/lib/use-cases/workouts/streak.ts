/**
 * Caso de uso: calcular streak de treinos consecutivos
 */

import { db } from "@/lib/db";

/**
 * Calcula o streak baseado em dias consecutivos de treino
 * @param studentId ID do estudante
 * @returns Número de dias consecutivos que o estudante treinou
 */
export async function calculateStreak(studentId: string): Promise<number> {
  const allWorkoutHistory = await db.workoutHistory.findMany({
    where: { studentId },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const workoutDays = new Set<string>();
  allWorkoutHistory.forEach((wh) => {
    const dateOnly = new Date(wh.date);
    dateOnly.setHours(0, 0, 0, 0);
    workoutDays.add(dateOnly.toISOString().split("T")[0]);
  });

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (workoutDays.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}
