import type { RequestDbMetric } from "@gymrats/domain";

const QUERY_GROUP_THRESHOLD = 5;
const TOTAL_QUERY_THRESHOLD = 10;

export type NPlusOnePattern = {
  signature: string;
  count: number;
  totalMs: number;
  maxMs: number;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeQuerySignature(query: string) {
  return normalizeWhitespace(query)
    .replace(/'[^']*'/g, "?")
    .replace(/\b\d+\b/g, "?")
    .replace(/\bIN\s*\([^)]*\)/gi, "IN (?)")
    .slice(0, 220);
}

export function detectNPlusOnePatterns(
  queryLog: RequestDbMetric[],
): NPlusOnePattern[] {
  if (queryLog.length <= TOTAL_QUERY_THRESHOLD) {
    return [];
  }

  const grouped = queryLog.reduce<Record<string, NPlusOnePattern>>(
    (accumulator, queryMetric) => {
      const signature = normalizeQuerySignature(queryMetric.query);
      const current = accumulator[signature] ?? {
        signature,
        count: 0,
        totalMs: 0,
        maxMs: 0,
      };

      current.count += 1;
      current.totalMs += queryMetric.durationMs;
      current.maxMs = Math.max(current.maxMs, queryMetric.durationMs);
      accumulator[signature] = current;

      return accumulator;
    },
    {},
  );

  return Object.values(grouped)
    .filter((pattern) => pattern.count > QUERY_GROUP_THRESHOLD)
    .sort(
      (left, right) =>
        right.count - left.count || right.totalMs - left.totalMs,
    );
}
