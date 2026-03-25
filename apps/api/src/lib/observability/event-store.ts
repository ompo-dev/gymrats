import { db } from "@/lib/db";
import { log } from "./logger";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function sanitizePayload(value: unknown): JsonValue {
  if (value == null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizePayload);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        sanitizePayload(entryValue),
      ]),
    );
  }

  return String(value);
}

export async function persistTelemetryEvent(input: {
  eventType: string;
  domain: string;
  actorId?: string | null;
  journey?: string | null;
  requestId?: string | null;
  releaseId?: string | null;
  featureFlagSet?: string[];
  metricName?: string | null;
  metricValue?: number | null;
  status?: string | null;
  payload?: unknown;
  occurredAt?: Date;
}) {
  try {
    const payload = sanitizePayload(input.payload ?? {});
    await db.telemetryEvent.create({
      data: {
        eventType: input.eventType,
        domain: input.domain,
        actorId: input.actorId ?? null,
        journey: input.journey ?? null,
        requestId: input.requestId ?? null,
        releaseId: input.releaseId ?? null,
        featureFlagSet:
          input.featureFlagSet && input.featureFlagSet.length > 0
            ? JSON.stringify(input.featureFlagSet)
            : null,
        metricName: input.metricName ?? null,
        metricValue: input.metricValue ?? null,
        status: input.status ?? null,
        payload: payload === null ? {} : payload,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  } catch (error) {
    log.debug("Telemetry persistence skipped", {
      error: error instanceof Error ? error.message : "unknown",
      eventType: input.eventType,
      domain: input.domain,
    });
  }
}

export async function persistBusinessEvent(input: {
  eventType: string;
  domain: string;
  actorId?: string | null;
  requestId?: string | null;
  releaseId?: string | null;
  status?: string | null;
  payload?: unknown;
  occurredAt?: Date;
}) {
  try {
    const payload = sanitizePayload(input.payload ?? {});
    await db.businessEvent.create({
      data: {
        eventType: input.eventType,
        domain: input.domain,
        actorId: input.actorId ?? null,
        requestId: input.requestId ?? null,
        releaseId: input.releaseId ?? null,
        status: input.status ?? null,
        payload: payload === null ? {} : payload,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  } catch (error) {
    log.debug("Business event persistence skipped", {
      error: error instanceof Error ? error.message : "unknown",
      eventType: input.eventType,
      domain: input.domain,
    });
  }
}
