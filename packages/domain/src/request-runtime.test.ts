import { describe, expect, it } from "vitest";
import {
  getRequestMetrics,
  recordDbQuery,
  recordExternalCall,
  runWithRequestContext,
} from "./request-runtime";

describe("request runtime", () => {
  it("aggregates db and external metrics per request", () => {
    const metrics = runWithRequestContext(
      {
        headers: new Headers(),
        requestId: "req-runtime-1",
      },
      () => {
        recordDbQuery({ query: "SELECT 1", durationMs: 120 });
        recordDbQuery({ query: "SELECT 2", durationMs: 240 });
        recordExternalCall(75);
        return getRequestMetrics();
      },
    );

    expect(metrics.dbMs).toBe(360);
    expect(metrics.dbQueryCount).toBe(2);
    expect(metrics.externalMs).toBe(75);
    expect(metrics.slowQueries).toHaveLength(1);
    expect(metrics.slowQueries[0]?.query).toBe("SELECT 2");
  });

  it("keeps only the five slowest queries", () => {
    const metrics = runWithRequestContext(
      {
        headers: new Headers(),
        requestId: "req-runtime-2",
      },
      () => {
        for (let index = 0; index < 7; index += 1) {
          recordDbQuery({
            query: `SELECT ${index}`,
            durationMs: 150 + index,
          });
        }
        return getRequestMetrics();
      },
    );

    expect(metrics.slowQueries).toHaveLength(5);
    expect(metrics.slowQueries[0]?.durationMs).toBe(156);
    expect(metrics.slowQueries[4]?.durationMs).toBe(152);
  });
});
