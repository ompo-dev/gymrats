/**
 * Métricas de API (latência, status).
 * Usado por createSafeHandler e handlers para registrar requisições.
 */

import { featureFlags, releaseInfo } from "@gymrats/config";
import { getRequestId, getRequestMetrics } from "@/lib/runtime/request-context";
import { persistTelemetryEvent } from "./event-store";
import { log } from "./logger";
import { detectNPlusOnePatterns } from "./request-insights";

export type ApiMetricContext = {
  method: string;
  path: string;
  routeKey?: string;
  status?: number;
  latencyMs: number;
  userId?: string;
  studentId?: string;
  gymId?: string;
  domain?: string;
  requestId?: string;
  releaseId?: string;
  featureFlagSet?: string[];
  dbMs?: number;
  dbQueryCount?: number;
  externalMs?: number;
  cacheMs?: number;
  cacheHits?: number;
  cacheMisses?: number;
  authMs?: number;
  handlerMs?: number;
  responseMs?: number;
  cacheHit?: boolean;
  error?: string;
};

export function recordApiRequest(ctx: ApiMetricContext) {
  const requestMetrics = getRequestMetrics();
  const requestId = ctx.requestId ?? getRequestId() ?? "unknown";
  const enabledFlags = Object.entries(featureFlags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag);
  const inferredDomain =
    ctx.path
      .replace(/^\/api\/?/, "")
      .split("/")[0]
      .trim() || "unknown";
  const domain = ctx.domain ?? inferredDomain;
  const payload = {
    ...ctx,
    requestId,
    routeKey: ctx.routeKey ?? ctx.path,
    releaseId: ctx.releaseId ?? releaseInfo.id,
    featureFlagSet: ctx.featureFlagSet ?? enabledFlags,
    dbMs: ctx.dbMs ?? requestMetrics.dbMs,
    dbQueryCount: ctx.dbQueryCount ?? requestMetrics.dbQueryCount,
    externalMs: ctx.externalMs ?? requestMetrics.externalMs,
    cacheMs: ctx.cacheMs ?? requestMetrics.cacheMs,
    cacheHits: ctx.cacheHits ?? requestMetrics.cacheHits,
    cacheMisses: ctx.cacheMisses ?? requestMetrics.cacheMisses,
    authMs: ctx.authMs ?? requestMetrics.authMs,
    handlerMs: ctx.handlerMs ?? requestMetrics.handlerMs,
    responseMs: ctx.responseMs ?? requestMetrics.responseMs,
    queryLog: requestMetrics.queryLog,
    cacheOps: requestMetrics.cacheOps,
    cacheHit:
      ctx.cacheHit ??
      (requestMetrics.cacheHits > 0 && requestMetrics.cacheMisses === 0),
    statusClass: ctx.status ? `${Math.floor(ctx.status / 100)}xx` : "unknown",
    domain,
  };
  const nPlusOnePatterns = detectNPlusOnePatterns(requestMetrics.queryLog);
  const { method, path, status, latencyMs, error } = payload;
  const message = error
    ? `API ${method} ${path} ${status ?? "-"} ${latencyMs}ms - ${error}`
    : `API ${method} ${path} ${status ?? "-"} ${latencyMs}ms`;

  if (error) {
    log.error(message, payload);
  } else {
    log.info(message, payload);
  }

  void persistTelemetryEvent({
    eventType: "api.request",
    domain,
    actorId: payload.userId ?? payload.studentId ?? payload.gymId,
    requestId,
    releaseId: payload.releaseId,
    featureFlagSet: payload.featureFlagSet,
    metricName: "latencyMs",
    metricValue: latencyMs,
    status: String(status ?? ""),
    payload: {
      ...payload,
      nPlusOnePatterns,
    },
  });

  if (nPlusOnePatterns.length > 0) {
    void persistTelemetryEvent({
      eventType: "performance.n_plus_one_detected",
      domain,
      actorId: payload.userId ?? payload.studentId ?? payload.gymId,
      requestId,
      releaseId: payload.releaseId,
      featureFlagSet: payload.featureFlagSet,
      status: "warning",
      payload: {
        route: payload.path,
        method: payload.method,
        dbQueryCount: payload.dbQueryCount,
        patterns: nPlusOnePatterns,
      },
    });
  }
}
