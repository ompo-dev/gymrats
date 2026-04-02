import "server-only";

import { readCachedApi } from "@/lib/actions/cached-reader";

export type ObservabilitySummary = {
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
  cache: {
    totalOps: number;
    hits: number;
    misses: number;
    hitRate: number;
    avgMs: number;
  };
  webVitals: {
    total: number;
    metrics: Array<{
      metric: string;
      count: number;
      p75: number;
      p95: number;
      lastSeenAt: string;
    }>;
  };
  domains: Array<{
    domain: string;
    total: number;
    errors: number;
    apiRequests: number;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    domain: string;
    status?: string | null;
    occurredAt: string;
  }>;
  note?: string;
};

export type ObservabilityRequests = {
  windowHours: number;
  requests: Array<{
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
  }>;
  note?: string;
};

export type ObservabilityRequestTrace = {
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
  events: Array<{
    id: string;
    eventType: string;
    domain: string;
    status?: string | null;
    occurredAt: string;
  }>;
  nPlusOnePatterns: Array<{
    signature: string;
    count: number;
    totalMs: number;
    maxMs: number;
  }>;
};

const BASE_TAGS = ["admin:observability"] as const;

export async function getObservabilitySummary() {
  return readCachedApi<ObservabilitySummary>({
    path: "/api/admin/observability/summary",
    query: { sinceHours: 24 },
    tags: [...BASE_TAGS, "admin:observability:summary"],
    profile: "seconds",
    scope: "private",
  });
}

export async function getObservabilityCacheSummary() {
  return readCachedApi<Pick<ObservabilitySummary, "windowHours" | "cache" | "note">>({
    path: "/api/admin/observability/cache",
    query: { sinceHours: 24 },
    tags: [...BASE_TAGS, "admin:observability:cache"],
    profile: "seconds",
    scope: "private",
  });
}

export async function getObservabilityWebVitals() {
  return readCachedApi<Pick<ObservabilitySummary, "windowHours" | "webVitals" | "note">>({
    path: "/api/admin/observability/web-vitals",
    query: { sinceHours: 24 },
    tags: [...BASE_TAGS, "admin:observability:web-vitals"],
    profile: "seconds",
    scope: "private",
  });
}

export async function getObservabilityRequests(limit = 50) {
  return readCachedApi<ObservabilityRequests>({
    path: "/api/admin/observability/requests",
    query: { sinceHours: 24, limit },
    tags: [...BASE_TAGS, "admin:observability:requests"],
    profile: "seconds",
    scope: "private",
  });
}

export async function getObservabilityRequestTrace(requestId: string) {
  return readCachedApi<ObservabilityRequestTrace>({
    path: `/api/admin/observability/requests/${requestId}`,
    tags: [...BASE_TAGS, `admin:observability:requests:${requestId}`],
    profile: "seconds",
    scope: "private",
  });
}
