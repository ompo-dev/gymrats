import { AsyncLocalStorage } from "node:async_hooks";

export type RequestDbMetric = {
  durationMs: number;
  query: string;
  target?: string;
};

export type RequestCacheMetric = {
  operation: "get" | "set" | "del" | "scan";
  key: string;
  hit?: boolean;
  durationMs: number;
};

export type RequestMetrics = {
  dbMs: number;
  dbQueryCount: number;
  externalMs: number;
  cacheMs: number;
  cacheHits: number;
  cacheMisses: number;
  authMs: number;
  handlerMs: number;
  responseMs: number;
  slowQueries: RequestDbMetric[];
  queryLog: RequestDbMetric[];
  cacheOps: RequestCacheMetric[];
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
    cacheMs: 0,
    cacheHits: 0,
    cacheMisses: 0,
    authMs: 0,
    handlerMs: 0,
    responseMs: 0,
    slowQueries: [],
    queryLog: [],
    cacheOps: [],
  };
}

function keepBoundedEntries<T>(
  entries: T[],
  nextEntry: T,
  maxEntries: number,
  sortFn?: (left: T, right: T) => number,
) {
  const nextEntries = [...entries, nextEntry];

  if (!sortFn) {
    return nextEntries.slice(-maxEntries);
  }

  return nextEntries.sort(sortFn).slice(0, maxEntries);
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
  context.metrics.queryLog = keepBoundedEntries(
    context.metrics.queryLog,
    metric,
    50,
  );

  if (metric.durationMs >= 150) {
    context.metrics.slowQueries = keepBoundedEntries(
      context.metrics.slowQueries,
      metric,
      5,
      (left, right) => right.durationMs - left.durationMs,
    );
  }
}

export function recordExternalCall(durationMs: number) {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  context.metrics.externalMs += durationMs;
}

export function recordCacheOperation(metric: RequestCacheMetric) {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  context.metrics.cacheMs += metric.durationMs;
  context.metrics.cacheOps = keepBoundedEntries(
    context.metrics.cacheOps,
    metric,
    50,
  );

  if (metric.hit === true) {
    context.metrics.cacheHits += 1;
  }

  if (metric.hit === false) {
    context.metrics.cacheMisses += 1;
  }
}

export function recordAuthTime(durationMs: number) {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  context.metrics.authMs += durationMs;
}

export function recordHandlerTime(durationMs: number) {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  context.metrics.handlerMs += durationMs;
}

export function recordResponseTime(durationMs: number) {
  const context = getRequestContext();

  if (!context) {
    return;
  }

  context.metrics.responseMs += durationMs;
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
    cacheMs: context.metrics.cacheMs,
    cacheHits: context.metrics.cacheHits,
    cacheMisses: context.metrics.cacheMisses,
    authMs: context.metrics.authMs,
    handlerMs: context.metrics.handlerMs,
    responseMs: context.metrics.responseMs,
    slowQueries: [...context.metrics.slowQueries],
    queryLog: [...context.metrics.queryLog],
    cacheOps: [...context.metrics.cacheOps],
  };
}
