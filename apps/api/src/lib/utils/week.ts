/**
 * Utilitários para cálculo de semana (Seg-Dom)
 * Timezone: America/Sao_Paulo (BRT)
 */

const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

/** Retorna a segunda-feira 00:00 da semana do date (em BRT) */
export function getMondayThisWeek(date: Date): Date {
  const d = new Date(date.getTime() + BRT_OFFSET_MS);
  const day = d.getUTCDay();
  // 0=Dom, 1=Seg, ..., 6=Sab. Seg = 1, então (day + 6) % 7 = 0 para Seg
  const daysToMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - BRT_OFFSET_MS);
}

/** Adiciona N dias à data */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Retorna a próxima segunda-feira (início da próxima semana) */
export function getNextMonday(date: Date = new Date()): Date {
  const thisMonday = getMondayThisWeek(date);
  return addDays(thisMonday, 7);
}

/** Retorna o início da semana atual do student (considera weekOverride para reset manual) */
export function getWeekStart(
  weekOverride: Date | null | undefined,
  now: Date = new Date(),
): Date {
  if (weekOverride) {
    return new Date(weekOverride);
  }
  return getMondayThisWeek(now);
}
