"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  useBootstrapHydrationEffect,
  useBootstrapTelemetry,
} from "@/hooks/use-bootstrap-lifecycle";
import type {
  BootstrapDomain,
  BootstrapResponseMeta,
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

export function useDomainBootstrap<TData, TSection extends string>({
  domain,
  sections,
  enabled,
  queryKey,
  queryFn,
}: DomainBootstrapOptions<TData, TSection>) {
  const query = useQuery({
    queryKey,
    queryFn,
    enabled: enabled ?? true,
    retry: false,
  });

  useBootstrapTelemetry({
    domain,
    sections,
    data: query.data?.data,
    meta: query.data?.meta,
  });

  return query;
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
