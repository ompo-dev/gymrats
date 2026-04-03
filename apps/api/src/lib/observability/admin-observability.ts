import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";

type JsonRecord = Record<string, unknown>;

type TelemetryEventRow = {
  id: string;
  eventType: string;
  domain: string | null;
  status: string | null;
  requestId: string | null;
  occurredAt: Date;
  metricName: string | null;
  metricValue: number | null;
  payload: JsonRecord | null;
};

type BusinessEventRow = {
  id: string;
  eventType: string;
  domain: string;
  requestId: string | null;
  status: string | null;
  payload: JsonRecord | null;
  occurredAt: Date;
};

type RouteSummary = {
  route: string;
  method: string;
  domain: string;
  count: number;
  errorCount: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  lastSeenAt: string;
  cacheHitRate: number;
};

type ErrorSummary = {
  fingerprint: string;
  route: string;
  count: number;
  lastSeenAt: string;
  sampleMessage: string;
};

type DomainSummary = {
  domain: string;
  total: number;
  errors: number;
  apiRequests: number;
};

type RecentEvent = {
  id: string;
  eventType: string;
  domain: string;
  status?: string | null;
  occurredAt: string;
  metricName?: string | null;
  metricValue?: number | null;
  requestId?: string | null;
  payload?: JsonRecord | null;
};

type RequestSummary = {
  requestId: string;
  route: string;
  method: string;
  domain: string;
  status: number;
  totalMs: number;
  dbMs: number;
  dbQueryCount: number;
  cacheMs: number;
  cacheHits: number;
  cacheMisses: number;
  externalMs: number;
  occurredAt: string;
  nPlusOneDetected: boolean;
};

type CacheSummary = {
  totalOps: number;
  hits: number;
  misses: number;
  hitRate: number;
  avgMs: number;
};

type WebVitalMetricSummary = {
  metric: string;
  count: number;
  p75: number;
  p95: number;
  lastSeenAt: string;
};

type RequestTraceEvent = {
  id: string;
  eventType: string;
  domain: string;
  status?: string | null;
  occurredAt: string;
  payload?: JsonRecord | null;
};

export type RequestTrace = {
  requestId: string;
  route: string;
  method: string;
  domain: string;
  status: number;
  totalMs: number;
  occurredAt: string;
  breakdown: {
    middlewareMs: number;
    authMs: number;
    handlerMs: number;
    dbMs: number;
    cacheMs: number;
    externalMs: number;
    responseMs: number;
  };
  dbQueries: Array<{
    sql: string;
    ms: number;
    target?: string;
  }>;
  cacheOps: Array<{
    key: string;
    hit: boolean | null;
    ms: number;
    operation: string;
  }>;
  events: RequestTraceEvent[];
  nPlusOnePatterns: Array<{
    signature: string;
    count: number;
    totalMs: number;
    maxMs: number;
  }>;
};

export type ObservabilityDataset = {
  windowHours: number;
  counts: {
    telemetryEvents: number;
    frontendEvents: number;
    businessEvents: number;
  };
  api: {
    requestCount: number;
    errorCount: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
  };
  cache: CacheSummary;
  webVitals: {
    total: number;
    metrics: WebVitalMetricSummary[];
  };
  domains: DomainSummary[];
  routes: RouteSummary[];
  errors: ErrorSummary[];
  requests: RequestSummary[];
  recentEvents: RecentEvent[];
  recentBusinessEvents: Array<{
    id: string;
    eventType: string;
    domain: string;
    requestId?: string | null;
    status?: string | null;
    occurredAt: string;
  }>;
  note?: string;
};

const OBSERVABILITY_CACHE_TTL_SECONDS = 30;
const REQUEST_TRACE_CACHE_TTL_SECONDS = 15;

function buildObservabilityCacheKey(sinceHours: number) {
  return `admin-observability:${sinceHours}:v2`;
}

function buildTraceCacheKey(requestId: string) {
  return `admin-observability:trace:${requestId}:v1`;
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );
  return sorted[index] ?? 0;
}

function toNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value ?? NaN);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function toLatency(event: TelemetryEventRow) {
  return typeof event.metricValue === "number"
    ? event.metricValue
    : toNumber(event.payload?.latencyMs);
}

function toRouteKey(event: TelemetryEventRow) {
  return String(
    event.payload?.routeKey ??
      event.payload?.path ??
      event.payload?.route ??
      "unknown",
  );
}

function toMethod(event: TelemetryEventRow) {
  return String(event.payload?.method ?? "GET").toUpperCase();
}

function toDomain(event: TelemetryEventRow) {
  return event.domain || String(event.payload?.domain ?? "unknown");
}

function toStatus(event: TelemetryEventRow) {
  return Number(event.status ?? event.payload?.status ?? 0);
}

function toSampleMessage(event: TelemetryEventRow) {
  return String(
    event.payload?.error ??
      event.payload?.message ??
      event.payload?.sampleMessage ??
      event.status ??
      "unknown",
  );
}

function toFingerprint(event: TelemetryEventRow) {
  return String(
    event.payload?.fingerprint ??
      `${event.eventType}:${toRouteKey(event)}:${toStatus(event) || "unknown"}`,
  );
}

function toRecentEvent(event: TelemetryEventRow): RecentEvent {
  return {
    id: event.id,
    eventType: event.eventType,
    domain: toDomain(event),
    status: event.status,
    occurredAt: event.occurredAt.toISOString(),
    metricName: event.metricName,
    metricValue: event.metricValue,
    requestId: event.requestId,
    payload: event.payload,
  };
}

function getPayloadArray(
  payload: JsonRecord | null | undefined,
  key: string,
): JsonRecord[] {
  const value = payload?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(toRecord)
    .filter((entry): entry is JsonRecord => entry !== null);
}

function buildCacheSummary(apiEvents: TelemetryEventRow[]): CacheSummary {
  const totalHits = apiEvents.reduce(
    (sum, event) => sum + toNumber(event.payload?.cacheHits),
    0,
  );
  const totalMisses = apiEvents.reduce(
    (sum, event) => sum + toNumber(event.payload?.cacheMisses),
    0,
  );
  const totalMs = apiEvents.reduce(
    (sum, event) => sum + toNumber(event.payload?.cacheMs),
    0,
  );
  const totalOps = totalHits + totalMisses;

  return {
    totalOps,
    hits: totalHits,
    misses: totalMisses,
    hitRate:
      totalOps > 0 ? Math.round((totalHits / totalOps) * 1000) / 1000 : 0,
    avgMs: totalOps > 0 ? Math.round(totalMs / totalOps) : 0,
  };
}

function buildWebVitalsSummary(
  telemetryEvents: TelemetryEventRow[],
): ObservabilityDataset["webVitals"] {
  const webVitalEvents = telemetryEvents.filter(
    (event) =>
      event.eventType === "frontend.web_vital" ||
      event.eventType.startsWith("web_vital."),
  );

  const metrics = Object.values(
    webVitalEvents.reduce<Record<string, WebVitalMetricSummary & { values: number[] }>>(
      (accumulator, event) => {
        const metric = String(
          event.metricName ?? event.eventType.replace(/^.*\./, ""),
        ).toLowerCase();

        if (!accumulator[metric]) {
          accumulator[metric] = {
            metric,
            count: 0,
            p75: 0,
            p95: 0,
            lastSeenAt: event.occurredAt.toISOString(),
            values: [],
          };
        }

        accumulator[metric].count += 1;
        accumulator[metric].lastSeenAt =
          accumulator[metric].lastSeenAt > event.occurredAt.toISOString()
            ? accumulator[metric].lastSeenAt
            : event.occurredAt.toISOString();

        const metricValue =
          typeof event.metricValue === "number"
            ? event.metricValue
            : toNumber(event.payload?.value);
        if (metricValue > 0) {
          accumulator[metric].values.push(metricValue);
        }

        return accumulator;
      },
      {},
    ),
  )
    .map((metric) => ({
      metric: metric.metric,
      count: metric.count,
      p75: percentile(metric.values, 0.75),
      p95: percentile(metric.values, 0.95),
      lastSeenAt: metric.lastSeenAt,
    }))
    .sort((left, right) => right.count - left.count);

  return {
    total: webVitalEvents.length,
    metrics,
  };
}

function buildRequestSummaries(apiEvents: TelemetryEventRow[]): RequestSummary[] {
  return apiEvents
    .filter((event) => Boolean(event.requestId))
    .map((event) => ({
      requestId: String(event.requestId),
      route: toRouteKey(event),
      method: toMethod(event),
      domain: toDomain(event),
      status: toStatus(event),
      totalMs: toLatency(event),
      dbMs: toNumber(event.payload?.dbMs),
      dbQueryCount: toNumber(event.payload?.dbQueryCount),
      cacheMs: toNumber(event.payload?.cacheMs),
      cacheHits: toNumber(event.payload?.cacheHits),
      cacheMisses: toNumber(event.payload?.cacheMisses),
      externalMs: toNumber(event.payload?.externalMs),
      occurredAt: event.occurredAt.toISOString(),
      nPlusOneDetected: getPayloadArray(event.payload, "nPlusOnePatterns").length > 0,
    }))
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime(),
    );
}

export async function getObservabilityDataset(
  sinceHours: number,
): Promise<ObservabilityDataset> {
  const cacheKey = buildObservabilityCacheKey(sinceHours);
  const cached = await getCachedJson<ObservabilityDataset>(cacheKey);
  if (cached) {
    return cached;
  }

  const occurredAt = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  try {
    const [telemetryEvents, businessEvents] = await Promise.all([
      db.telemetryEvent.findMany({
        where: {
          occurredAt: {
            gte: occurredAt,
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
        take: 5000,
        select: {
          id: true,
          eventType: true,
          domain: true,
          status: true,
          requestId: true,
          occurredAt: true,
          metricName: true,
          metricValue: true,
          payload: true,
        },
      }) as Promise<TelemetryEventRow[]>,
      db.businessEvent.findMany({
        where: {
          occurredAt: {
            gte: occurredAt,
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
        take: 1000,
        select: {
          id: true,
          eventType: true,
          domain: true,
          requestId: true,
          status: true,
          payload: true,
          occurredAt: true,
        },
      }) as Promise<BusinessEventRow[]>,
    ]);

    const apiEvents = telemetryEvents.filter(
      (event) => event.eventType === "api.request",
    );
    const frontendEvents = telemetryEvents.filter(
      (event) => event.domain === "web",
    );
    const latencies = apiEvents
      .map(toLatency)
      .filter((value) => Number.isFinite(value) && value > 0);
    const errorCount = apiEvents.filter(
      (event) => toStatus(event) >= 400,
    ).length;

    const domains = Object.values(
      telemetryEvents.reduce<Record<string, DomainSummary>>(
        (accumulator, event) => {
          const domain = toDomain(event);
          if (!accumulator[domain]) {
            accumulator[domain] = {
              domain,
              total: 0,
              errors: 0,
              apiRequests: 0,
            };
          }

          accumulator[domain].total += 1;
          if (event.eventType === "api.request") {
            accumulator[domain].apiRequests += 1;
            if (toStatus(event) >= 400) {
              accumulator[domain].errors += 1;
            }
          }

          return accumulator;
        },
        {},
      ),
    ).sort((left, right) => right.total - left.total);

    const routes = Object.values(
      apiEvents.reduce<
        Record<
          string,
          RouteSummary & { latencies: number[]; cacheHits: number }
        >
      >((accumulator, event) => {
        const route = toRouteKey(event);
        const method = toMethod(event);
        const domain = toDomain(event);
        const key = `${method}:${route}`;
        if (!accumulator[key]) {
          accumulator[key] = {
            route,
            method,
            domain,
            count: 0,
            errorCount: 0,
            avgMs: 0,
            p50Ms: 0,
            p95Ms: 0,
            lastSeenAt: event.occurredAt.toISOString(),
            cacheHitRate: 0,
            latencies: [],
            cacheHits: 0,
          };
        }

        const latency = toLatency(event);
        accumulator[key].count += 1;
        accumulator[key].errorCount += toStatus(event) >= 400 ? 1 : 0;
        accumulator[key].lastSeenAt =
          accumulator[key].lastSeenAt > event.occurredAt.toISOString()
            ? accumulator[key].lastSeenAt
            : event.occurredAt.toISOString();
        if (latency > 0) {
          accumulator[key].latencies.push(latency);
        }
        if (toNumber(event.payload?.cacheHits) > 0) {
          accumulator[key].cacheHits += 1;
        }

        return accumulator;
      }, {}),
    )
      .map((route) => ({
        route: route.route,
        method: route.method,
        domain: route.domain,
        count: route.count,
        errorCount: route.errorCount,
        avgMs:
          route.latencies.length > 0
            ? Math.round(
                route.latencies.reduce((sum, value) => sum + value, 0) /
                  route.latencies.length,
              )
            : 0,
        p50Ms: percentile(route.latencies, 0.5),
        p95Ms: percentile(route.latencies, 0.95),
        lastSeenAt: route.lastSeenAt,
        cacheHitRate:
          route.count > 0
            ? Math.round((route.cacheHits / route.count) * 1000) / 1000
            : 0,
      }))
      .sort(
        (left, right) => right.p95Ms - left.p95Ms || right.count - left.count,
      );

    const errors = Object.values(
      telemetryEvents.reduce<Record<string, ErrorSummary>>(
        (accumulator, event) => {
          const isApiError =
            event.eventType === "api.request" && toStatus(event) >= 400;
          const isFrontendError = event.eventType.includes("error");
          if (!isApiError && !isFrontendError) {
            return accumulator;
          }

          const fingerprint = toFingerprint(event);
          if (!accumulator[fingerprint]) {
            accumulator[fingerprint] = {
              fingerprint,
              route: toRouteKey(event),
              count: 0,
              lastSeenAt: event.occurredAt.toISOString(),
              sampleMessage: toSampleMessage(event),
            };
          }

          accumulator[fingerprint].count += 1;
          if (
            accumulator[fingerprint].lastSeenAt < event.occurredAt.toISOString()
          ) {
            accumulator[fingerprint].lastSeenAt =
              event.occurredAt.toISOString();
            accumulator[fingerprint].sampleMessage = toSampleMessage(event);
          }

          return accumulator;
        },
        {},
      ),
    ).sort((left, right) => right.count - left.count);

    const dataset: ObservabilityDataset = {
      windowHours: sinceHours,
      counts: {
        telemetryEvents: telemetryEvents.length,
        frontendEvents: frontendEvents.length,
        businessEvents: businessEvents.length,
      },
      api: {
        requestCount: apiEvents.length,
        errorCount,
        avgLatencyMs:
          latencies.length > 0
            ? Math.round(
                latencies.reduce((sum, value) => sum + value, 0) /
                  latencies.length,
              )
            : 0,
        p50LatencyMs: percentile(latencies, 0.5),
        p95LatencyMs: percentile(latencies, 0.95),
      },
      cache: buildCacheSummary(apiEvents),
      webVitals: buildWebVitalsSummary(telemetryEvents),
      domains,
      routes,
      errors,
      requests: buildRequestSummaries(apiEvents).slice(0, 100),
      recentEvents: telemetryEvents.slice(0, 50).map(toRecentEvent),
      recentBusinessEvents: businessEvents.slice(0, 25).map((event) => ({
        id: event.id,
        eventType: event.eventType,
        domain: event.domain,
        requestId: event.requestId,
        status: event.status,
        occurredAt: event.occurredAt.toISOString(),
      })),
    };

    await setCachedJson(cacheKey, dataset, OBSERVABILITY_CACHE_TTL_SECONDS);
    return dataset;
  } catch (error) {
    return {
      windowHours: sinceHours,
      counts: {
        telemetryEvents: 0,
        frontendEvents: 0,
        businessEvents: 0,
      },
      api: {
        requestCount: 0,
        errorCount: 0,
        avgLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
      },
      cache: {
        totalOps: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        avgMs: 0,
      },
      webVitals: {
        total: 0,
        metrics: [],
      },
      domains: [],
      routes: [],
      errors: [],
      requests: [],
      recentEvents: [],
      recentBusinessEvents: [],
      note:
        error instanceof Error
          ? error.message
          : "Telemetry tables are not available yet.",
    };
  }
}

export async function getRequestTrace(
  requestId: string,
): Promise<RequestTrace | null> {
  if (!requestId) {
    return null;
  }

  const cacheKey = buildTraceCacheKey(requestId);
  const cached = await getCachedJson<RequestTrace>(cacheKey);
  if (cached) {
    return cached;
  }

  const [requestEvent, relatedTelemetry, relatedBusinessEvents] =
    await Promise.all([
      db.telemetryEvent.findFirst({
        where: {
          eventType: "api.request",
          requestId,
        },
        orderBy: {
          occurredAt: "desc",
        },
        select: {
          id: true,
          eventType: true,
          domain: true,
          status: true,
          requestId: true,
          occurredAt: true,
          metricName: true,
          metricValue: true,
          payload: true,
        },
      }) as Promise<TelemetryEventRow | null>,
      db.telemetryEvent.findMany({
        where: {
          requestId,
        },
        orderBy: {
          occurredAt: "asc",
        },
        take: 200,
        select: {
          id: true,
          eventType: true,
          domain: true,
          status: true,
          requestId: true,
          occurredAt: true,
          metricName: true,
          metricValue: true,
          payload: true,
        },
      }) as Promise<TelemetryEventRow[]>,
      db.businessEvent.findMany({
        where: {
          requestId,
        },
        orderBy: {
          occurredAt: "asc",
        },
        take: 200,
        select: {
          id: true,
          eventType: true,
          domain: true,
          requestId: true,
          status: true,
          payload: true,
          occurredAt: true,
        },
      }) as Promise<BusinessEventRow[]>,
    ]);

  if (!requestEvent) {
    return null;
  }

  const queryLog = getPayloadArray(requestEvent.payload, "queryLog").map(
    (query) => ({
      sql: String(query.query ?? "unknown"),
      ms: toNumber(query.durationMs),
      target:
        typeof query.target === "string" ? query.target : undefined,
    }),
  );
  const cacheOps = getPayloadArray(requestEvent.payload, "cacheOps").map(
    (operation) => ({
      key: String(operation.key ?? "unknown"),
      hit:
        typeof operation.hit === "boolean"
          ? operation.hit
          : operation.hit == null
            ? null
            : Boolean(operation.hit),
      ms: toNumber(operation.durationMs),
      operation: String(operation.operation ?? "unknown"),
    }),
  );
  const nPlusOnePatterns = getPayloadArray(
    requestEvent.payload,
    "nPlusOnePatterns",
  ).map((pattern) => ({
    signature: String(pattern.signature ?? "unknown"),
    count: toNumber(pattern.count),
    totalMs: toNumber(pattern.totalMs),
    maxMs: toNumber(pattern.maxMs),
  }));

  const trace: RequestTrace = {
    requestId,
    route: toRouteKey(requestEvent),
    method: toMethod(requestEvent),
    domain: toDomain(requestEvent),
    status: toStatus(requestEvent),
    totalMs: toLatency(requestEvent),
    occurredAt: requestEvent.occurredAt.toISOString(),
    breakdown: {
      middlewareMs: Math.max(
        0,
        toLatency(requestEvent) -
          toNumber(requestEvent.payload?.authMs) -
          toNumber(requestEvent.payload?.handlerMs) -
          toNumber(requestEvent.payload?.responseMs),
      ),
      authMs: toNumber(requestEvent.payload?.authMs),
      handlerMs: toNumber(requestEvent.payload?.handlerMs),
      dbMs: toNumber(requestEvent.payload?.dbMs),
      cacheMs: toNumber(requestEvent.payload?.cacheMs),
      externalMs: toNumber(requestEvent.payload?.externalMs),
      responseMs: toNumber(requestEvent.payload?.responseMs),
    },
    dbQueries: queryLog,
    cacheOps,
    events: [
      ...relatedTelemetry
        .filter((event) => event.id !== requestEvent.id)
        .map(toRecentEvent),
      ...relatedBusinessEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        domain: event.domain,
        status: event.status,
        occurredAt: event.occurredAt.toISOString(),
        payload: event.payload,
      })),
    ].sort(
      (left, right) =>
        new Date(left.occurredAt).getTime() -
        new Date(right.occurredAt).getTime(),
    ),
    nPlusOnePatterns,
  };

  await setCachedJson(cacheKey, trace, REQUEST_TRACE_CACHE_TTL_SECONDS);
  return trace;
}
