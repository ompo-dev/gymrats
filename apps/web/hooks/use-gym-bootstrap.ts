"use client";

import { featureFlags } from "@gymrats/config";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getGymBootstrapRequest } from "@/lib/api/bootstrap";
import { isClientApiCapabilityEnabled } from "@/lib/api/route-capabilities";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";
import { queryKeys } from "@/lib/query/query-keys";
import type { GymDataSection } from "@/lib/types/gym-unified";

export function useGymBootstrap(
  sections?: readonly GymDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useQuery({
    queryKey: queryKeys.gymBootstrap(sections),
    queryFn: () => getGymBootstrapRequest(sections),
    enabled:
      (options?.enabled ?? true) &&
      featureFlags.perfGymBootstrapV2 &&
      isClientApiCapabilityEnabled("gymBootstrap"),
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
      eventType: "gym.bootstrap_loaded",
      domain: "gym",
      journey: "gym",
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
