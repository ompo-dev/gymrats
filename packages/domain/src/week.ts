/**
 * Utilities for week calculations (Mon-Sun)
 * Timezone: America/Sao_Paulo (BRT)
 */

const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

export function getMondayThisWeek(date: Date): Date {
  const shiftedDate = new Date(date.getTime() + BRT_OFFSET_MS);
  const day = shiftedDate.getUTCDay();
  const daysToMonday = (day + 6) % 7;
  shiftedDate.setUTCDate(shiftedDate.getUTCDate() - daysToMonday);
  shiftedDate.setUTCHours(0, 0, 0, 0);
  return new Date(shiftedDate.getTime() - BRT_OFFSET_MS);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getNextMonday(date: Date = new Date()): Date {
  const thisMonday = getMondayThisWeek(date);
  return addDays(thisMonday, 7);
}

export function getWeekStart(
  weekOverride: Date | null | undefined,
  now: Date = new Date(),
): Date {
  if (weekOverride) {
    return new Date(weekOverride);
  }
  return getMondayThisWeek(now);
}
