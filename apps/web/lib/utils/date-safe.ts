import type { DateLike, JsonValue } from "@/lib/types/api-error";

export function toValidDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
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

/** Campos conhecidos que devem ser convertidos para Date em objetos gym */
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

/**
 * Normaliza recursivamente campos de data em objetos do domínio gym.
 * Converte strings/numbers para Date onde apropriado, evitando "e.getTime is not a function".
 */
export function normalizeGymDates<T>(data: T): T {
  if (data == null) return data;
  if (Array.isArray(data)) {
    return data.map((item) => normalizeGymDates(item)) as T;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const out: Record<string, JsonValue> = {};
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
