import { describe, expect, it } from "vitest";
import {
  buildAccessDedupeKey,
  normalizeTemplatePayload,
  projectSessionToLegacyCheckIn,
  resolveAccessDirection,
} from "./presence";

describe("presence domain", () => {
  it("normalizes provider payloads using the declarative template", () => {
    const occurredAt = "2026-03-31T12:30:00.000Z";
    const normalized = normalizeTemplatePayload(
      {
        event: {
          id: "evt-1",
          timestamp: occurredAt,
          direction: "entrada",
          credential: {
            type: "rfid",
            value: "CARD-9",
          },
        },
        device: {
          id: "turnstile-7",
        },
      },
      {
        eventIdPath: "event.id",
        occurredAtPath: "event.timestamp",
        directionPath: "event.direction",
        identifierTypePath: "event.credential.type",
        identifierValuePath: "event.credential.value",
        deviceIdPath: "device.id",
        metadataPaths: {
          deviceRef: "device.id",
        },
        staticMetadata: {
          provider: "generic",
        },
      },
    );

    expect(normalized.providerEventId).toBe("evt-1");
    expect(normalized.externalDeviceId).toBe("turnstile-7");
    expect(normalized.identifierType).toBe("rfid");
    expect(normalized.identifierValue).toBe("CARD-9");
    expect(normalized.directionReceived).toBe("entry");
    expect(normalized.occurredAt.toISOString()).toBe(occurredAt);
    expect(normalized.metadata).toEqual({
      provider: "generic",
      deviceRef: "turnstile-7",
    });
  });

  it("resolves direction with provider priority and auto fallback", () => {
    expect(
      resolveAccessDirection({
        providerDirection: "exit",
        directionMode: "provider",
        hasOpenSession: true,
      }),
    ).toEqual({ direction: "exit", inferred: false });

    expect(
      resolveAccessDirection({
        providerDirection: "unknown",
        directionMode: "auto",
        hasOpenSession: false,
      }),
    ).toEqual({ direction: "entry", inferred: true });

    expect(
      resolveAccessDirection({
        providerDirection: "unknown",
        directionMode: "auto",
        hasOpenSession: true,
      }),
    ).toEqual({ direction: "exit", inferred: true });
  });

  it("builds deterministic dedupe keys and projects legacy sessions", () => {
    const occurredAt = new Date("2026-03-31T15:00:00.000Z");
    const dedupeKey = buildAccessDedupeKey({
      gymId: "gym-1",
      deviceId: "device-1",
      identifierType: "rfid",
      identifierValue: "CARD-9",
      occurredAt,
    });

    expect(dedupeKey).toHaveLength(64);
    expect(
      projectSessionToLegacyCheckIn({
        id: "presence-1",
        gymId: "gym-1",
        subjectType: "STUDENT",
        subjectId: "student-1",
        studentId: "student-1",
        subjectName: "Aluno Teste",
        status: "closed",
        entryAt: occurredAt,
        exitAt: new Date("2026-03-31T16:15:00.000Z"),
        openedBySource: "legacy_import",
        closedBySource: "legacy_import",
        legacyCheckInId: "legacy-1",
      }),
    ).toEqual({
      id: "legacy-1",
      studentId: "student-1",
      studentName: "Aluno Teste",
      timestamp: occurredAt,
      checkOut: new Date("2026-03-31T16:15:00.000Z"),
      duration: 75,
    });
  });
});
