import { ServerApiError } from "./server";

type DateLike = Date | string | null | undefined;

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ServerApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function buildApiPath(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  if (!query) {
    return path;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  if (!queryString) {
    return path;
  }

  return `${path}?${queryString}`;
}

export function reviveDate(value: DateLike): DateLike {
  if (value == null || value instanceof Date) {
    return value;
  }

  return new Date(value);
}
