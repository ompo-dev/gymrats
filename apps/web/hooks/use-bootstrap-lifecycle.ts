"use client";

import { useEffect, useMemo, useRef } from "react";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";
import {
  type BootstrapDomain,
  type BootstrapResponseMeta,
  buildBootstrapHydrationKey,
  markBootstrapHydrated,
  normalizeBootstrapSections,
  resolveBootstrapRequestId,
} from "@/lib/query/bootstrap-runtime";

interface BootstrapTelemetryOptions<TData> {
  domain: BootstrapDomain;
  data: TData | null | undefined;
  meta: BootstrapResponseMeta | null | undefined;
  sections?: readonly string[];
}

interface BootstrapHydrationOptions {
  domain: BootstrapDomain;
  meta: BootstrapResponseMeta | null | undefined;
  sections?: readonly string[];
  ready?: boolean;
  onHydrate: () => void;
}

export function useBootstrapTelemetry<TData>({
  domain,
  data,
  meta,
  sections,
}: BootstrapTelemetryOptions<TData>) {
  const lastTrackedRequestId = useRef<string | null>(null);
  const normalizedSections = useMemo(
    () => normalizeBootstrapSections(sections),
    [sections],
  );

  useEffect(() => {
    if (!data || !meta?.requestId) {
      return;
    }

    if (meta.requestId === lastTrackedRequestId.current) {
      return;
    }

    lastTrackedRequestId.current = meta.requestId;
    const payloadBytes = new Blob([JSON.stringify(data)]).size;

    void recordClientTelemetryEvent({
      eventType: `${domain}.bootstrap_loaded`,
      domain,
      journey: domain,
      metricName: "bootstrapBytes",
      metricValue: payloadBytes,
      payload: {
        requestId: meta.requestId,
        generatedAt: meta.generatedAt,
        sections:
          normalizedSections === "all"
            ? ["all"]
            : normalizedSections.split(","),
        sectionTimings: meta.sectionTimings,
      },
    });
  }, [data, domain, meta, normalizedSections]);
}

export function useBootstrapHydrationEffect({
  domain,
  meta,
  sections,
  ready = true,
  onHydrate,
}: BootstrapHydrationOptions) {
  const normalizedSections = useMemo(
    () => normalizeBootstrapSections(sections),
    [sections],
  );
  const hydrationKey = useMemo(
    () => buildBootstrapHydrationKey(domain, sections),
    [domain, sections],
  );

  useEffect(() => {
    if (!ready) {
      return;
    }

    const requestId = resolveBootstrapRequestId(meta, normalizedSections);
    if (!markBootstrapHydrated(hydrationKey, requestId)) {
      return;
    }

    onHydrate();
  }, [hydrationKey, meta, normalizedSections, onHydrate, ready]);
}
