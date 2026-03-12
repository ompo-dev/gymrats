"use client";

import { featureFlags } from "@gymrats/config";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getPersonalBootstrapRequest } from "@/lib/api/bootstrap";
import { isClientApiCapabilityEnabled } from "@/lib/api/route-capabilities";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";
import { queryKeys } from "@/lib/query/query-keys";
import type { PersonalDataSection } from "@/lib/types/personal-unified";

export function usePersonalBootstrap(
  sections?: readonly PersonalDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useQuery({
    queryKey: queryKeys.personalBootstrap(sections),
    queryFn: () => getPersonalBootstrapRequest(sections),
    enabled:
      (options?.enabled ?? true) &&
      featureFlags.perfPersonalBootstrapV2 &&
      isClientApiCapabilityEnabled("personalBootstrap"),
    retry: false,
  });
  const lastTrackedRequestId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !query.data?.meta.requestId ||
      query.data.meta.requestId === lastTrackedRequestId.current
    ) {
      return;
    }

    lastTrackedRequestId.current = query.data.meta.requestId;
    const payloadBytes = new Blob([JSON.stringify(query.data.data)]).size;

    void recordClientTelemetryEvent({
      eventType: "personal.bootstrap_loaded",
      domain: "personal",
      journey: "personal",
      metricName: "bootstrapBytes",
      metricValue: payloadBytes,
      payload: {
        requestId: query.data.meta.requestId,
        generatedAt: query.data.meta.generatedAt,
        sections: sections ?? ["all"],
        sectionTimings: query.data.meta.sectionTimings,
      },
    });
  }, [query.data, sections]);

  return query;
}
