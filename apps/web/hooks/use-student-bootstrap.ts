"use client";

import { featureFlags } from "@gymrats/config";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getStudentBootstrapRequest } from "@/lib/api/bootstrap";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";
import { queryKeys } from "@/lib/query/query-keys";
import type {
  StudentData,
  StudentDataSection,
} from "@/lib/types/student-unified";

export function useStudentBootstrap(
  sections?: readonly StudentDataSection[],
  options?: {
    enabled?: boolean;
  },
) {
  const query = useQuery({
    queryKey: queryKeys.studentBootstrap(sections),
    queryFn: () => getStudentBootstrapRequest(sections),
    enabled:
      (options?.enabled ?? true) &&
      featureFlags.perfStudentBootstrapV2,
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
      eventType: "student.bootstrap_loaded",
      domain: "student",
      journey: "student",
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

export function useStudentPayments(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["payments"], options);
  return {
    ...query,
    payments:
      (query.data?.data.payments as Partial<StudentData>["payments"]) ?? [],
  };
}

export function useStudentMemberships(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["memberships"], options);
  return {
    ...query,
    memberships:
      (query.data?.data.memberships as Partial<StudentData>["memberships"]) ??
      [],
  };
}

export function useSubscriptionState(options?: { enabled?: boolean }) {
  const query = useStudentBootstrap(["subscription"], options);
  return {
    ...query,
    subscription: query.data?.data.subscription ?? null,
  };
}
