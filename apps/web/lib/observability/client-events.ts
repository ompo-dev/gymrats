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
let isFlushingTelemetry = false;
let didRegisterLifecycleFlush = false;
const pendingEvents: Array<Record<string, unknown>> = [];
const MAX_PENDING_EVENTS = 200;
const MAX_BATCH_SIZE = 20;
const TELEMETRY_RETRY_DELAY_MS = 5_000;

function registerLifecycleFlush() {
  if (typeof window === "undefined" || didRegisterLifecycleFlush) {
    return;
  }

  didRegisterLifecycleFlush = true;

  const flushNow = () => {
    void flushTelemetryQueue({ flushAll: true });
  };

  window.addEventListener("pagehide", flushNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushNow();
    }
  });
}

function scheduleFlush(delayMs = 0) {
  if (typeof window === "undefined" || flushHandle !== null) {
    return;
  }

  registerLifecycleFlush();

  const flush = () => {
    flushHandle = null;
    void flushTelemetryQueue();
  };

  if (delayMs > 0) {
    flushHandle = globalThis.setTimeout(flush, delayMs) as unknown as number;
    return;
  }

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

async function flushTelemetryQueue(options: { flushAll?: boolean } = {}) {
  if (pendingEvents.length === 0 || isFlushingTelemetry) {
    return;
  }

  if (
    observabilityEndpointState === "missing" ||
    observabilityEndpointState === "probing"
  ) {
    if (pendingEvents.length > 0) {
      scheduleFlush(TELEMETRY_RETRY_DELAY_MS);
    }
    return;
  }

  isFlushingTelemetry = true;
  let retryDelayMs = 0;

  try {
    while (pendingEvents.length > 0) {
      const batch = pendingEvents.slice(0, MAX_BATCH_SIZE);
      if (batch.length === 0) {
        break;
      }

      const isCapabilityProbe = observabilityEndpointState === "unknown";
      if (isCapabilityProbe) {
        observabilityEndpointState = "probing";
      }

      const response = await browserApiFetch("/api/observability/events", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch.length === 1 ? batch[0] : batch),
      });

      if (response.status === 404) {
        observabilityEndpointState = "missing";
        disableClientApiCapability("observabilityEvents");
        pendingEvents.length = 0;
        return;
      }

      if (!response.ok) {
        if (isCapabilityProbe) {
          observabilityEndpointState = "unknown";
        }
        retryDelayMs = TELEMETRY_RETRY_DELAY_MS;
        break;
      }

      observabilityEndpointState = "available";
      pendingEvents.splice(0, batch.length);

      if (!options.flushAll) {
        break;
      }
    }
  } catch {
    if (observabilityEndpointState === "probing") {
      observabilityEndpointState = "unknown";
    }
    retryDelayMs = TELEMETRY_RETRY_DELAY_MS;
  } finally {
    isFlushingTelemetry = false;
    if (pendingEvents.length > 0) {
      scheduleFlush(retryDelayMs);
    }
  }
}

function enqueueTelemetryEvent(event: Record<string, unknown>) {
  if (pendingEvents.length >= MAX_PENDING_EVENTS) {
    pendingEvents.splice(0, pendingEvents.length - MAX_PENDING_EVENTS + 1);
  }

  pendingEvents.push(event);
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

  enqueueTelemetryEvent({
    ...input,
    releaseId: releaseInfo.id,
    featureFlagSet: Object.entries(featureFlags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag),
  });
  scheduleFlush();
}
