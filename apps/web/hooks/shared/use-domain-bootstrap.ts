"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useBootstrapHydrationEffect,
  useBootstrapTelemetry,
} from "@/hooks/use-bootstrap-lifecycle";
import {
  type BootstrapDomain,
  type BootstrapResponseMeta,
  buildBootstrapHydrationKey,
} from "@/lib/query/bootstrap-runtime";

interface DomainBootstrapOptions<TData, TSection extends string> {
  domain: BootstrapDomain;
  sections?: readonly TSection[];
  enabled?: boolean;
  queryKey: readonly unknown[];
  queryFn: () => Promise<{
    data: TData;
    meta?: BootstrapResponseMeta | null;
  }>;
}

interface DomainBootstrapBridgeOptions<
  TData,
  TSection extends string,
  TNormalizedData,
> extends DomainBootstrapOptions<TData, TSection> {
  normalizeData: (data: TData) => TNormalizedData;
  hydrate: (data: TNormalizedData) => void;
}

type DomainBootstrapResult<TData> = {
  data: TData;
  meta?: BootstrapResponseMeta | null;
};

type DomainBootstrapState<TData> = {
  data?: DomainBootstrapResult<TData>;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
};

const bootstrapPromiseCache = new Map<string, Promise<unknown>>();
const bootstrapResultCache = new Map<
  string,
  {
    data: DomainBootstrapResult<unknown>;
    expiresAt: number;
  }
>();
const DOMAIN_BOOTSTRAP_TTL_MS: Record<BootstrapDomain, number> = {
  student: 15_000,
  gym: 15_000,
  personal: 15_000,
};

function buildQueryCacheKey(
  domain: BootstrapDomain,
  sections?: readonly string[],
  queryKey?: readonly unknown[],
) {
  if (queryKey && queryKey.length > 0) {
    return `${domain}:${JSON.stringify(queryKey)}`;
  }

  return buildBootstrapHydrationKey(domain, sections);
}

function getCachedBootstrapResult<TData>(cacheKey: string) {
  const cached = bootstrapResultCache.get(cacheKey) as
    | {
        data: DomainBootstrapResult<TData>;
        expiresAt: number;
      }
    | undefined;

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    bootstrapResultCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function getBootstrapResultTtlMs<TData>(
  domain: BootstrapDomain,
  result: DomainBootstrapResult<TData>,
) {
  const metaTtlMs = result.meta?.cache?.ttlMs;

  if (
    typeof metaTtlMs === "number" &&
    Number.isFinite(metaTtlMs) &&
    metaTtlMs > 0
  ) {
    return metaTtlMs;
  }

  return DOMAIN_BOOTSTRAP_TTL_MS[domain];
}

function setCachedBootstrapResult<TData>(
  cacheKey: string,
  domain: BootstrapDomain,
  result: DomainBootstrapResult<TData>,
) {
  const ttlMs = getBootstrapResultTtlMs(domain, result);

  if (ttlMs <= 0) {
    bootstrapResultCache.delete(cacheKey);
    return;
  }

  bootstrapResultCache.set(cacheKey, {
    data: result as DomainBootstrapResult<unknown>,
    expiresAt: Date.now() + ttlMs,
  });
}

async function resolveBootstrapQuery<TData>(
  cacheKey: string,
  domain: BootstrapDomain,
  queryFn: () => Promise<DomainBootstrapResult<TData>>,
  fresh = false,
) {
  if (!fresh) {
    const cached = getCachedBootstrapResult<TData>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const pending = bootstrapPromiseCache.get(cacheKey);
  if (pending) {
    return pending as Promise<DomainBootstrapResult<TData>>;
  }

  const promise = queryFn()
    .then((result) => {
      setCachedBootstrapResult(cacheKey, domain, result);
      return result;
    })
    .finally(() => {
      bootstrapPromiseCache.delete(cacheKey);
    });

  bootstrapPromiseCache.set(cacheKey, promise);
  return promise;
}

export function invalidateDomainBootstrapCache(domain?: BootstrapDomain) {
  if (!domain) {
    bootstrapPromiseCache.clear();
    bootstrapResultCache.clear();
    return;
  }

  const prefix = `${domain}:`;

  for (const key of bootstrapPromiseCache.keys()) {
    if (key.startsWith(prefix)) {
      bootstrapPromiseCache.delete(key);
    }
  }

  for (const key of bootstrapResultCache.keys()) {
    if (key.startsWith(prefix)) {
      bootstrapResultCache.delete(key);
    }
  }
}

export function useDomainBootstrap<TData, TSection extends string>({
  domain,
  sections,
  enabled,
  queryKey,
  queryFn,
}: DomainBootstrapOptions<TData, TSection>) {
  const isEnabled = enabled ?? true;
  const cacheKey = useMemo(
    () => buildQueryCacheKey(domain, sections, queryKey),
    [domain, queryKey, sections],
  );
  const mountedRef = useRef(true);
  const queryFnRef = useRef(queryFn);
  const latestDataRef = useRef<DomainBootstrapResult<TData> | undefined>(
    undefined,
  );
  const [state, setState] = useState<DomainBootstrapState<TData>>({
    data: undefined,
    error: null,
    isLoading: isEnabled,
    isFetching: false,
  });

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  useEffect(() => {
    latestDataRef.current = state.data;
  }, [state.data]);

  const runQuery = useCallback(
    async (fresh = false) => {
      if (!fresh && !isEnabled) {
        return latestDataRef.current;
      }

      if (mountedRef.current) {
        setState((current) => ({
          data: current.data,
          error: null,
          isLoading: !current.data,
          isFetching: true,
        }));
      }

      try {
        const result = await resolveBootstrapQuery(
          cacheKey,
          domain,
          queryFnRef.current,
          fresh,
        );

        if (mountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
            isFetching: false,
          });
        }

        return result;
      } catch (error) {
        const resolvedError =
          error instanceof Error
            ? error
            : new Error("Erro ao carregar bootstrap");

        if (mountedRef.current) {
          setState((current) => ({
            data: current.data,
            error: resolvedError,
            isLoading: false,
            isFetching: false,
          }));
        }

        throw resolvedError;
      }
    },
    [cacheKey, domain, isEnabled],
  );

  useEffect(() => {
    if (!isEnabled) {
      setState((current) => ({
        data: current.data,
        error: null,
        isLoading: false,
        isFetching: false,
      }));
      return;
    }

    setState((current) => ({
      data: current.data,
      error: null,
      isLoading: !current.data,
      isFetching: Boolean(current.data),
    }));

    void runQuery(false);
  }, [cacheKey, isEnabled, runQuery]);

  useBootstrapTelemetry({
    domain,
    sections,
    data: state.data?.data,
    meta: state.data?.meta,
  });

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isFetching: state.isFetching,
    refetch: () => runQuery(true),
  };
}

export function useDomainBootstrapBridge<
  TData,
  TSection extends string,
  TNormalizedData,
>({
  domain,
  sections,
  enabled,
  queryKey,
  queryFn,
  normalizeData,
  hydrate,
}: DomainBootstrapBridgeOptions<TData, TSection, TNormalizedData>) {
  const query = useDomainBootstrap({
    domain,
    sections,
    enabled,
    queryKey,
    queryFn,
  });

  const normalizedData = useMemo(
    () => (query.data?.data ? normalizeData(query.data.data) : null),
    [normalizeData, query.data?.data],
  );

  const handleHydrate = useCallback(() => {
    if (!normalizedData) {
      return;
    }

    hydrate(normalizedData);
  }, [hydrate, normalizedData]);

  useBootstrapHydrationEffect({
    domain,
    sections,
    meta: query.data?.meta,
    ready: Boolean(normalizedData),
    onHydrate: handleHydrate,
  });

  return query;
}
