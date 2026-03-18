/**
 * Métricas de API (latência, status).
 * Usado por createSafeHandler e handlers para registrar requisições.
 */

import { featureFlags, releaseInfo } from "@gymrats/config";
import { getRequestId, getRequestMetrics } from "@/lib/runtime/request-context";
import { persistTelemetryEvent } from "./event-store";
import { log } from "./logger";

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
    cacheHit: ctx.cacheHit ?? false,
    statusClass: ctx.status ? `${Math.floor(ctx.status / 100)}xx` : "unknown",
    domain,
  };
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
    payload,
  });
}
