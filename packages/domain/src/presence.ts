import { createHash } from "node:crypto";
import type {
  AccessDirection,
  AccessDirectionMode,
  AccessPayloadTemplate,
  LegacyCheckInProjection,
  PresenceSessionRecord,
} from "@gymrats/types";

function toPathSegments(path: string) {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function extractPathValue(
  source: unknown,
  path: string | null | undefined,
): unknown {
  if (!path) {
    return undefined;
  }

  let cursor = source as Record<string, unknown> | unknown[] | undefined;

  for (const segment of toPathSegments(path)) {
    if (cursor == null || typeof cursor !== "object") {
      return undefined;
    }

    cursor = Reflect.get(cursor, segment) as
      | Record<string, unknown>
      | unknown[]
      | undefined;
  }

  return cursor;
}

export function normalizeAccessDirection(
  value: unknown,
): AccessDirection | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "entry" ||
    normalized === "enter" ||
    normalized === "in" ||
    normalized === "entrada" ||
    normalized === "checkin"
  ) {
    return "entry";
  }

  if (
    normalized === "exit" ||
    normalized === "out" ||
    normalized === "saida" ||
    normalized === "checkout"
  ) {
    return "exit";
  }

  if (normalized === "unknown" || normalized === "none") {
    return "unknown";
  }

  return null;
}

export function coerceDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const asDate = new Date(value);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const asDate = new Date(value);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
  }

  return null;
}

export function normalizeTemplatePayload(
  payload: unknown,
  template: AccessPayloadTemplate | null | undefined,
) {
  const occurredAt =
    coerceDate(extractPathValue(payload, template?.occurredAtPath)) ?? new Date();

  const identifierValue = extractPathValue(payload, template?.identifierValuePath);
  const identifierType = extractPathValue(payload, template?.identifierTypePath);

  const metadata = Object.fromEntries(
    Object.entries(template?.metadataPaths ?? {}).map(([key, path]) => [
      key,
      extractPathValue(payload, path),
    ]),
  );

  return {
    providerEventId: extractPathValue(payload, template?.eventIdPath),
    externalDeviceId: extractPathValue(payload, template?.deviceIdPath),
    occurredAt,
    identifierValue:
      identifierValue == null ? null : String(identifierValue).trim(),
    identifierType: identifierType == null ? null : String(identifierType).trim(),
    directionReceived:
      normalizeAccessDirection(
        extractPathValue(payload, template?.directionPath),
      ) ?? "unknown",
    result: extractPathValue(payload, template?.resultPath),
    heartbeat: extractPathValue(payload, template?.heartbeatPath),
    metadata: {
      ...template?.staticMetadata,
      ...metadata,
    },
  };
}

export function buildAccessDedupeKey(input: {
  gymId: string;
  deviceId?: string | null;
  providerEventId?: string | null;
  identifierType?: string | null;
  identifierValue?: string | null;
  occurredAt: Date;
}) {
  if (input.providerEventId && input.providerEventId.trim().length > 0) {
    return `${input.gymId}:${input.deviceId ?? "global"}:${input.providerEventId.trim()}`;
  }

  const fingerprint = [
    input.gymId,
    input.deviceId ?? "global",
    input.identifierType ?? "unknown",
    input.identifierValue ?? "unknown",
    input.occurredAt.toISOString(),
  ].join("|");

  return createHash("sha256").update(fingerprint).digest("hex");
}

export function resolveAccessDirection(input: {
  providerDirection: AccessDirection | null | undefined;
  directionMode: AccessDirectionMode;
  hasOpenSession: boolean;
}) {
  if (
    input.providerDirection &&
    input.providerDirection !== "unknown" &&
    input.directionMode === "provider"
  ) {
    return { direction: input.providerDirection, inferred: false };
  }

  if (input.directionMode === "entry") {
    return { direction: "entry" as const, inferred: true };
  }

  if (input.directionMode === "exit") {
    return { direction: "exit" as const, inferred: true };
  }

  if (input.providerDirection && input.providerDirection !== "unknown") {
    return { direction: input.providerDirection, inferred: false };
  }

  return {
    direction: input.hasOpenSession ? ("exit" as const) : ("entry" as const),
    inferred: true,
  };
}

export function projectSessionToLegacyCheckIn(
  session: PresenceSessionRecord,
): LegacyCheckInProjection | null {
  if (session.subjectType !== "STUDENT" || !session.studentId) {
    return null;
  }

  return {
    id: session.legacyCheckInId || session.id,
    studentId: session.studentId,
    studentName: session.subjectName ?? "Aluno",
    timestamp: session.entryAt,
    checkOut: session.exitAt ?? undefined,
    duration:
      session.exitAt == null
        ? undefined
        : Math.max(
            0,
            Math.round(
              (session.exitAt.getTime() - session.entryAt.getTime()) / 60000,
            ),
          ),
  };
}
