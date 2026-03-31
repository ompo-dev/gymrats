import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";

type TelemetryEventRow = {
  id: string;
  eventType: string;
  domain: string | null;
  status: string | null;
  occurredAt: Date;
  metricName: string | null;
  metricValue: number | null;
  payload: Record<string, unknown> | null;
};

type BusinessEventRow = {
  id: string;
  eventType: string;
  domain: string;
  status: string | null;
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
  payload?: Record<string, unknown> | null;
};

type ObservabilityDataset = {
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
  domains: DomainSummary[];
  routes: RouteSummary[];
  errors: ErrorSummary[];
  recentEvents: RecentEvent[];
  recentBusinessEvents: Array<{
    id: string;
    eventType: string;
    domain: string;
    status?: string | null;
    occurredAt: string;
  }>;
  note?: string;
};

const OBSERVABILITY_CACHE_TTL_SECONDS = 30;

function buildObservabilityCacheKey(sinceHours: number) {
  return `admin-observability:${sinceHours}:v1`;
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

function toLatency(event: TelemetryEventRow) {
  return typeof event.metricValue === "number"
    ? event.metricValue
    : Number(event.payload?.latencyMs ?? 0);
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
          status: true,
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
        if (event.payload?.cacheHit === true) {
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
      domains,
      routes,
      errors,
      recentEvents: telemetryEvents.slice(0, 50).map((event) => ({
        id: event.id,
        eventType: event.eventType,
        domain: toDomain(event),
        status: event.status,
        occurredAt: event.occurredAt.toISOString(),
        metricName: event.metricName,
        metricValue: event.metricValue,
        payload: event.payload,
      })),
      recentBusinessEvents: businessEvents.slice(0, 25).map((event) => ({
        id: event.id,
        eventType: event.eventType,
        domain: event.domain,
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
      domains: [],
      routes: [],
      errors: [],
      recentEvents: [],
      recentBusinessEvents: [],
      note:
        error instanceof Error
          ? error.message
          : "Telemetry tables are not available yet.",
    };
  }
}
