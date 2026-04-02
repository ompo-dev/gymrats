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

function buildQueryCacheKey(
  domain: BootstrapDomain,
  sections?: readonly string[],
) {
  return buildBootstrapHydrationKey(domain, sections);
}

async function resolveBootstrapQuery<TData>(
  cacheKey: string,
  queryFn: () => Promise<DomainBootstrapResult<TData>>,
) {
  const pending = bootstrapPromiseCache.get(cacheKey);
  if (pending) {
    return pending as Promise<DomainBootstrapResult<TData>>;
  }

  const promise = queryFn().finally(() => {
    bootstrapPromiseCache.delete(cacheKey);
  });

  bootstrapPromiseCache.set(cacheKey, promise);
  return promise;
}

export function invalidateDomainBootstrapCache(domain?: BootstrapDomain) {
  if (!domain) {
    bootstrapPromiseCache.clear();
    return;
  }

  const prefix = `${domain}:`;

  for (const key of bootstrapPromiseCache.keys()) {
    if (key.startsWith(prefix)) {
      bootstrapPromiseCache.delete(key);
    }
  }
}

export function useDomainBootstrap<TData, TSection extends string>({
  domain,
  sections,
  enabled,
  queryFn,
}: DomainBootstrapOptions<TData, TSection>) {
  const isEnabled = enabled ?? true;
  const cacheKey = useMemo(
    () => buildQueryCacheKey(domain, sections),
    [domain, sections],
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
        const result = await resolveBootstrapQuery(cacheKey, queryFnRef.current);

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
    [cacheKey, isEnabled],
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
