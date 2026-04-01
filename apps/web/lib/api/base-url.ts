export const SAME_ORIGIN_API_BASE = "/api";

export function normalizeApiBaseUrl(url: string | undefined | null): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (
    trimmed === SAME_ORIGIN_API_BASE ||
    trimmed === `${SAME_ORIGIN_API_BASE}/`
  ) {
    return SAME_ORIGIN_API_BASE;
  }

  return trimmed.replace(/\/$/, "");
}

export function isSameOriginApiBaseUrl(
  url: string | undefined | null,
): boolean {
  return normalizeApiBaseUrl(url) === SAME_ORIGIN_API_BASE;
}
