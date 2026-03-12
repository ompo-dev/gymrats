import { AsyncLocalStorage } from "node:async_hooks";

export type RequestDbMetric = {
  durationMs: number;
  query: string;
  target?: string;
};

export type RequestMetrics = {
  dbMs: number;
  dbQueryCount: number;
  externalMs: number;
  slowQueries: RequestDbMetric[];
};

export type RequestRuntimeContext = {
  headers: Headers;
  requestId: string;
  startedAt: number;
  metrics: RequestMetrics;
};

const requestContextStorage = new AsyncLocalStorage<RequestRuntimeContext>();

function createEmptyMetrics(): RequestMetrics {
  return {
    dbMs: 0,
    dbQueryCount: 0,
    externalMs: 0,
    slowQueries: [],
  };
}

export function runWithRequestContext<T>(
  input: {
    headers: Headers;
    requestId: string;
    startedAt?: number;
  },
  callback: () => T,
): T {
  return requestContextStorage.run(
    {
      headers: new Headers(input.headers),
      requestId: input.requestId,
      startedAt: input.startedAt ?? Date.now(),
      metrics: createEmptyMetrics(),
    },
    callback,
  );
}

export function getRequestContext() {
  return requestContextStorage.getStore() ?? null;
}

export function getRequestContextHeaders(): Headers | null {
  return getRequestContext()?.headers ?? null;
}

export function getRequestContextCookie(name: string): string | null {
  const headers = getRequestContextHeaders();
  const cookieHeader = headers?.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawKey, ...rest] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export function getRequestId() {
  return getRequestContext()?.requestId ?? null;
}

export function recordDbQuery(metric: RequestDbMetric) {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  context.metrics.dbMs += metric.durationMs;
  context.metrics.dbQueryCount += 1;

  if (metric.durationMs >= 150) {
    context.metrics.slowQueries.push(metric);
    if (context.metrics.slowQueries.length > 5) {
      context.metrics.slowQueries = context.metrics.slowQueries
        .sort((left, right) => right.durationMs - left.durationMs)
        .slice(0, 5);
    }
  }
}

export function recordExternalCall(durationMs: number) {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  context.metrics.externalMs += durationMs;
}

export function getRequestMetrics() {
  const context = getRequestContext();

  if (!context) {
    return createEmptyMetrics();
  }

  return {
    dbMs: context.metrics.dbMs,
    dbQueryCount: context.metrics.dbQueryCount,
    externalMs: context.metrics.externalMs,
    slowQueries: [...context.metrics.slowQueries],
  };
}
