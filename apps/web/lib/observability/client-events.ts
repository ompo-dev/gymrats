"use client";

import { featureFlags, releaseInfo } from "@gymrats/config";
import { browserApiFetch } from "@/lib/api/browser-fetch";
import {
  disableClientApiCapability,
  isClientApiCapabilityEnabled,
} from "@/lib/api/route-capabilities";

let observabilityEndpointState:
  | "unknown"
  | "probing"
  | "available"
  | "missing" = "unknown";
let flushHandle: number | null = null;
const pendingEvents: Array<Record<string, unknown>> = [];

function scheduleFlush() {
  if (typeof window === "undefined" || flushHandle !== null) {
    return;
  }

  const flush = () => {
    flushHandle = null;
    void flushTelemetryQueue();
  };

  const windowWithIdleCallback = window as Window & {
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout: number },
    ) => number;
  };

  if (windowWithIdleCallback.requestIdleCallback) {
    flushHandle = windowWithIdleCallback.requestIdleCallback(flush, {
      timeout: 2_000,
    });
    return;
  }

  flushHandle = globalThis.setTimeout(flush, 750) as unknown as number;
}

async function flushTelemetryQueue() {
  if (pendingEvents.length === 0) {
    return;
  }

  const nextEvent = pendingEvents.shift();
  if (!nextEvent) {
    return;
  }

  if (
    observabilityEndpointState === "missing" ||
    observabilityEndpointState === "probing"
  ) {
    if (pendingEvents.length > 0) {
      scheduleFlush();
    }
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
      body: JSON.stringify(nextEvent),
    });

    if (response.status === 404) {
      observabilityEndpointState = "missing";
      disableClientApiCapability("observabilityEvents");
      pendingEvents.length = 0;
      return;
    }

    observabilityEndpointState = "available";
  } catch {
    if (isCapabilityProbe) {
      observabilityEndpointState = "unknown";
    }
  } finally {
    if (pendingEvents.length > 0) {
      scheduleFlush();
    }
  }
}

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

  pendingEvents.push({
    ...input,
    releaseId: releaseInfo.id,
    featureFlagSet: Object.entries(featureFlags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag),
  });
  scheduleFlush();
}
