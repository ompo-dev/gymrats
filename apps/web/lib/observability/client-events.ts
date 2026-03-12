"use client";

import { featureFlags, releaseInfo } from "@gymrats/config";
import { browserApiFetch } from "@/lib/api/browser-fetch";

export async function recordClientTelemetryEvent(input: {
  eventType: string;
  domain: string;
  journey?: string;
  metricName?: string;
  metricValue?: number;
  status?: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await browserApiFetch("/api/observability/events", {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...input,
        releaseId: releaseInfo.id,
        featureFlagSet: Object.entries(featureFlags)
          .filter(([, enabled]) => enabled)
          .map(([flag]) => flag),
      }),
    });
  } catch {
    // Telemetria nao deve bloquear UX.
  }
}
