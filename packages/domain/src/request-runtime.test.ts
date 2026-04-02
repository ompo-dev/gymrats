import { describe, expect, it } from "vitest";
import {
  getRequestMetrics,
  recordAuthTime,
  recordCacheOperation,
  recordDbQuery,
  recordExternalCall,
  recordHandlerTime,
  recordResponseTime,
  runWithRequestContext,
} from "./request-runtime";

describe("request runtime", () => {
  it("aggregates db, cache, phase and external metrics per request", () => {
    const metrics = runWithRequestContext(
      {
        headers: new Headers(),
        requestId: "req-runtime-1",
      },
      () => {
        recordDbQuery({ query: "SELECT 1", durationMs: 120 });
        recordDbQuery({ query: "SELECT 2", durationMs: 240 });
        recordCacheOperation({
          operation: "get",
          key: "student:bootstrap:123",
          hit: true,
          durationMs: 12,
        });
        recordCacheOperation({
          operation: "get",
          key: "student:dashboard:123",
          hit: false,
          durationMs: 18,
        });
        recordAuthTime(15);
        recordHandlerTime(85);
        recordResponseTime(6);
        recordExternalCall(75);
        return getRequestMetrics();
      },
    );

    expect(metrics.dbMs).toBe(360);
    expect(metrics.dbQueryCount).toBe(2);
    expect(metrics.cacheMs).toBe(30);
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.cacheMisses).toBe(1);
    expect(metrics.authMs).toBe(15);
    expect(metrics.handlerMs).toBe(85);
    expect(metrics.responseMs).toBe(6);
    expect(metrics.externalMs).toBe(75);
    expect(metrics.slowQueries).toHaveLength(1);
    expect(metrics.slowQueries[0]?.query).toBe("SELECT 2");
    expect(metrics.queryLog).toHaveLength(2);
    expect(metrics.cacheOps).toHaveLength(2);
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

  it("keeps only the fifty latest cache and query log entries", () => {
    const metrics = runWithRequestContext(
      {
        headers: new Headers(),
        requestId: "req-runtime-3",
      },
      () => {
        for (let index = 0; index < 55; index += 1) {
          recordDbQuery({
            query: `SELECT ${index}`,
            durationMs: 10 + index,
          });
          recordCacheOperation({
            operation: "get",
            key: `cache:${index}`,
            hit: index % 2 === 0,
            durationMs: index,
          });
        }
        return getRequestMetrics();
      },
    );

    expect(metrics.queryLog).toHaveLength(50);
    expect(metrics.queryLog[0]?.query).toBe("SELECT 5");
    expect(metrics.queryLog[49]?.query).toBe("SELECT 54");
    expect(metrics.cacheOps).toHaveLength(50);
    expect(metrics.cacheOps[0]?.key).toBe("cache:5");
    expect(metrics.cacheOps[49]?.key).toBe("cache:54");
  });
});
