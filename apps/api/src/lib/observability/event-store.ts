import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { log } from "./logger";
import type { TelemetryEventInput } from "./telemetry-types";

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

function toTelemetryEventCreateManyInput(
  input: TelemetryEventInput,
): Prisma.TelemetryEventCreateManyInput {
  const payload = sanitizePayload(input.payload ?? {});

  return {
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
    payload: (payload === null ? {} : payload) as Prisma.InputJsonValue,
    occurredAt: input.occurredAt ?? new Date(),
  };
}

export async function persistTelemetryEvents(inputs: TelemetryEventInput[]) {
  if (inputs.length === 0) {
    return;
  }

  try {
    await db.telemetryEvent.createMany({
      data: inputs.map(toTelemetryEventCreateManyInput),
    });
  } catch (error) {
    log.debug("Telemetry persistence skipped", {
      error: error instanceof Error ? error.message : "unknown",
      eventType: inputs[0]?.eventType,
      domain: inputs[0]?.domain,
      batchSize: inputs.length,
    });
  }
}

export async function persistTelemetryEvent(input: TelemetryEventInput) {
  await persistTelemetryEvents([input]);
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
