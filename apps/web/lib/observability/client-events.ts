"use client";

import { featureFlags, releaseInfo } from "@gymrats/config";
import { browserApiFetch } from "@/lib/api/browser-fetch";
import {
  disableClientApiCapability,
  isClientApiCapabilityEnabled,
} from "@/lib/api/route-capabilities";

let observabilityEndpointState: "unknown" | "probing" | "available" | "missing" =
  "unknown";

export async function recordClientTelemetryEvent(input: {
  eventType: string;
  domain: string;
  journey?: string;
  metricName?: string;
  metricValue?: number;
  status?: string;
  payload?: Record<string, unknown>;
}) {
  if (
    !featureFlags.observabilityClientEventsEnabled ||
    !isClientApiCapabilityEnabled("observabilityEvents")
  ) {
    return;
  }

  if (
    observabilityEndpointState === "missing" ||
    observabilityEndpointState === "probing"
  ) {
    return;
  }

  const isCapabilityProbe = observabilityEndpointState === "unknown";
  if (isCapabilityProbe) {
    observabilityEndpointState = "probing";
  }

  try {
    const response = await browserApiFetch("/api/observability/events", {
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

    if (response.status === 404) {
      observabilityEndpointState = "missing";
      disableClientApiCapability("observabilityEvents");
      return;
    }

    observabilityEndpointState = "available";
  } catch {
    if (isCapabilityProbe) {
      observabilityEndpointState = "unknown";
    }
    // Telemetria nao deve bloquear UX.
  }
}
