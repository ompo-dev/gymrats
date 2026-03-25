import type { DateLike } from "@gymrats/types/api-error";

export function toValidDate(value: DateLike): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function getTimeMs(value: DateLike): number | null {
  const date = toValidDate(value);
  return date ? date.getTime() : null;
}

export function formatDatePtBr(value: DateLike): string | null {
  const date = toValidDate(value);
  return date ? date.toLocaleDateString("pt-BR") : null;
}

const DATE_FIELDS = new Set([
  "date",
  "dueDate",
  "joinDate",
  "lastVisit",
  "purchaseDate",
  "lastMaintenance",
  "nextMaintenance",
  "nextScheduled",
  "timestamp",
  "checkOut",
  "startTime",
  "endTime",
  "currentPeriodStart",
  "currentPeriodEnd",
  "canceledAt",
  "trialStart",
  "trialEnd",
  "lastSync",
  "createdAt",
]);

export function normalizeGymDates<T>(data: T): T {
  if (data == null) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => normalizeGymDates(item)) as T;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      if (
        DATE_FIELDS.has(key) &&
        (typeof val === "string" || typeof val === "number")
      ) {
        const parsed = toValidDate(val);
        out[key] = parsed ?? val;
      } else {
        out[key] =
          typeof val === "object" && val !== null && !(val instanceof Date)
            ? normalizeGymDates(val)
            : val;
      }
    }
    return out as T;
  }
  return data;
}
