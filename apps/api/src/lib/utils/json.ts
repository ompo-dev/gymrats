import {
  parseJsonArray as baseParseJsonArray,
  parseJsonSafe as baseParseJsonSafe,
} from "@gymrats/domain/json";

export function parseJsonSafe<T>(
  value: string | null | undefined,
  fallback?: T,
): T | null {
  const parsed = baseParseJsonSafe<T>(value);
  return parsed ?? fallback ?? null;
}

export function parseJsonArray<T>(
  value: string | null | undefined,
  fallback: T[] = [],
): T[] {
  const parsed = baseParseJsonSafe<T[]>(value);
  return Array.isArray(parsed) ? parsed : fallback;
}
