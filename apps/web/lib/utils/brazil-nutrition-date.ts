const BRAZIL_UTC_OFFSET_HOURS = -3;
const RESET_HOUR_BRT = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function toDateKeyFromTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function toNutritionDateKeyFromDate(date: Date): string {
  const utcMs = date.getTime();
  const brtMs = utcMs + BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000;
  const shiftedMs = brtMs - RESET_HOUR_BRT * 60 * 60 * 1000;

  return toDateKeyFromTimestamp(shiftedMs);
}

export function getBrazilNutritionDateKey(input?: string | Date): string {
  if (!input) {
    return toNutritionDateKeyFromDate(new Date());
  }

  if (input instanceof Date) {
    return toNutritionDateKeyFromDate(input);
  }

  if (DATE_KEY_REGEX.test(input)) {
    return input;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data inválida para nutrição");
  }

  return toNutritionDateKeyFromDate(parsed);
}

export function getBrazilNutritionDayRange(dateKey: string): {
  start: Date;
  end: Date;
} {
  if (!DATE_KEY_REGEX.test(dateKey)) {
    throw new Error("DateKey inválida para nutrição");
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const utcStartHour = RESET_HOUR_BRT - BRAZIL_UTC_OFFSET_HOURS;
  const startUtcMs = Date.UTC(year, month - 1, day, utcStartHour, 0, 0, 0);

  return {
    start: new Date(startUtcMs),
    end: new Date(startUtcMs + DAY_IN_MS - 1),
  };
}
