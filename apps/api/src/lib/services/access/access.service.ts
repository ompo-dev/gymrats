import { accessEventQueue } from "@gymrats/cache";
import {
  buildAccessDedupeKey,
  normalizeTemplatePayload,
  projectSessionToLegacyCheckIn,
  resolveAccessDirection,
} from "@gymrats/domain";
import type { Prisma } from "@prisma/client";
import type {
  AccessCredentialBinding as AccessCredentialBindingSnapshot,
  AccessDeviceSnapshot,
  AccessDirection,
  AccessEventFeedItem,
  AccessEventSource,
  AccessEventStatus,
  AccessOverview,
  AccessPayloadTemplate,
  AccessPresenceGroup,
  AccessSubjectType,
  LegacyCheckInProjection,
  PresenceSessionRecord,
} from "@gymrats/types";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  deleteCacheKeysByPrefix,
  getCachedJson,
  setCachedJson,
} from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import { log } from "@/lib/observability";

const ACCESS_CACHE_TTL_SECONDS = 15;
const LEGACY_RECENT_CHECKINS_TTL_SECONDS = 10;

type AccessActor = {
  actorRole: string;
  actorUserId?: string | null;
};

type MatchedSubject = {
  subjectType: AccessSubjectType;
  subjectId: string;
  studentId?: string | null;
  personalId?: string | null;
  subjectName?: string | null;
};

type TransactionClient = Prisma.TransactionClient;

function toJsonRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toPrismaJson(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function hashAccessSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function verifyAccessSecret(input: {
  candidate?: string | null;
  secretHash?: string | null;
}) {
  if (!input.secretHash) {
    return true;
  }

  if (!input.candidate) {
    return false;
  }

  const left = Buffer.from(hashAccessSecret(input.candidate), "utf8");
  const right = Buffer.from(input.secretHash, "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function toAccessDeviceSnapshot(
  device: {
    id: string;
    gymId: string;
    name: string;
    vendorKey: string;
    adapterKey: string;
    hardwareType: string;
    authModes: unknown;
    transport: "webhook" | "bridge" | "manual";
    status: "active" | "paused" | "offline" | "error";
    externalDeviceId: string | null;
    externalSerial: string | null;
    directionMode: string;
    dedupeWindowSeconds: number;
    lastHeartbeatAt: Date | null;
    lastEventAt: Date | null;
    payloadTemplate: unknown;
    settings: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
): AccessDeviceSnapshot {
  return {
    id: device.id,
    gymId: device.gymId,
    name: device.name,
    vendorKey: device.vendorKey,
    adapterKey: device.adapterKey,
    hardwareType: device.hardwareType,
    authModes: Array.isArray(device.authModes)
      ? device.authModes.map(String)
      : [],
    transport: device.transport,
    status: device.status,
    externalDeviceId: device.externalDeviceId,
    externalSerial: device.externalSerial,
    directionMode:
      device.directionMode === "provider" ||
      device.directionMode === "entry" ||
      device.directionMode === "exit"
        ? device.directionMode
        : "auto",
    dedupeWindowSeconds: device.dedupeWindowSeconds,
    lastHeartbeatAt: device.lastHeartbeatAt,
    lastEventAt: device.lastEventAt,
    payloadTemplate:
      device.payloadTemplate &&
      typeof device.payloadTemplate === "object" &&
      !Array.isArray(device.payloadTemplate)
        ? (device.payloadTemplate as AccessPayloadTemplate)
        : null,
    settings:
      device.settings && typeof device.settings === "object"
        ? (device.settings as Record<string, unknown>)
        : null,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

function toSubjectFromBinding(
  binding: {
    subjectType: "STUDENT" | "PERSONAL";
    subjectId: string;
    studentId: string | null;
    personalId: string | null;
    student?: { user?: { name?: string | null } | null } | null;
    personal?: { name?: string | null } | null;
  },
): MatchedSubject {
  return {
    subjectType: binding.subjectType,
    subjectId: binding.subjectId,
    studentId: binding.studentId,
    personalId: binding.personalId,
    subjectName:
      binding.subjectType === "STUDENT"
        ? binding.student?.user?.name ?? "Aluno"
        : binding.personal?.name ?? "Personal",
  };
}

function toBindingSnapshot(
  binding: {
    id: string;
    gymId: string;
    subjectType: "STUDENT" | "PERSONAL";
    subjectId: string;
    studentId: string | null;
    personalId: string | null;
    providerKey: string | null;
    deviceId: string | null;
    identifierType: string;
    identifierValue: string;
    isActive: boolean;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    student?: { user?: { name?: string | null } | null } | null;
    personal?: { name?: string | null } | null;
  },
): AccessCredentialBindingSnapshot {
  return {
    id: binding.id,
    gymId: binding.gymId,
    subjectType: binding.subjectType,
    subjectId: binding.subjectId,
    studentId: binding.studentId,
    personalId: binding.personalId,
    subjectName:
      binding.subjectType === "STUDENT"
        ? binding.student?.user?.name ?? "Aluno"
        : binding.personal?.name ?? "Personal",
    deviceId: binding.deviceId,
    providerKey: binding.providerKey,
    identifierType: binding.identifierType,
    identifierValue: binding.identifierValue,
    isActive: binding.isActive,
    metadata: toJsonRecord(binding.metadata),
    createdAt: binding.createdAt,
    updatedAt: binding.updatedAt,
  };
}

function toPresenceSessionRecord(
  session: {
    id: string;
    gymId: string;
    subjectType: "STUDENT" | "PERSONAL";
    subjectId: string;
    studentId: string | null;
    personalId: string | null;
    subjectName: string | null;
    status: "open" | "closed" | "manually_closed" | "anomalous";
    entryAt: Date;
    exitAt: Date | null;
    openedBySource:
      | "device"
      | "manual_gym"
      | "manual_personal"
      | "legacy_import"
      | "app_mobile";
    closedBySource:
      | "device"
      | "manual_gym"
      | "manual_personal"
      | "legacy_import"
      | "app_mobile"
      | null;
    entryDeviceId: string | null;
    exitDeviceId: string | null;
    inferenceFlags: unknown;
    legacyCheckInId: string | null;
  },
): PresenceSessionRecord {
  return {
    id: session.id,
    gymId: session.gymId,
    subjectType: session.subjectType,
    subjectId: session.subjectId,
    studentId: session.studentId,
    personalId: session.personalId,
    subjectName: session.subjectName,
    status: session.status,
    entryAt: session.entryAt,
    exitAt: session.exitAt,
    openedBySource: session.openedBySource,
    closedBySource: session.closedBySource,
    entryDeviceId: session.entryDeviceId,
    exitDeviceId: session.exitDeviceId,
    inferenceFlags:
      session.inferenceFlags &&
      typeof session.inferenceFlags === "object" &&
      !Array.isArray(session.inferenceFlags)
        ? (session.inferenceFlags as Record<string, unknown>)
        : null,
    legacyCheckInId: session.legacyCheckInId,
  };
}

function toAccessFeedItem(
  event: {
    id: string;
    gymId: string;
    deviceId: string | null;
    subjectType: "STUDENT" | "PERSONAL" | null;
    subjectId: string | null;
    studentId: string | null;
    personalId: string | null;
    subjectName: string | null;
    source:
      | "device"
      | "manual_gym"
      | "manual_personal"
      | "legacy_import"
      | "app_mobile";
    status:
      | "pending_match"
      | "applied"
      | "duplicate"
      | "ignored"
      | "anomalous";
    confidence: string;
    providerKey: string | null;
    providerEventId: string | null;
    identifierType: string | null;
    identifierValue: string | null;
    directionReceived: "entry" | "exit" | "unknown";
    directionResolved: "entry" | "exit" | "unknown";
    occurredAt: Date;
    metadata: unknown;
    actorRole: string | null;
    actorUserId: string | null;
    manualReason: string | null;
    device?: { name: string | null } | null;
  },
): AccessEventFeedItem {
  return {
    id: event.id,
    gymId: event.gymId,
    deviceId: event.deviceId,
    deviceName: event.device?.name ?? null,
    vendorKey: event.providerKey,
    providerEventId: event.providerEventId,
    source: event.source,
    status: event.status,
    confidence: event.confidence,
    subjectType: event.subjectType ?? "STUDENT",
    subjectId: event.subjectId ?? "",
    studentId: event.studentId,
    personalId: event.personalId,
    subjectName: event.subjectName,
    identifierType: event.identifierType,
    identifierValue: event.identifierValue,
    directionReceived: event.directionReceived,
    directionResolved: event.directionResolved,
    occurredAt: event.occurredAt,
    manualReason: event.manualReason,
    actorRole: event.actorRole,
    actorUserId: event.actorUserId,
    metadata: toJsonRecord(event.metadata),
  };
}

function buildAccessCacheKey(
  gymId: string,
  resource: string,
  suffix?: string | null,
) {
  return suffix
    ? `access:gym:${gymId}:${resource}:${suffix}`
    : `access:gym:${gymId}:${resource}`;
}

async function invalidateAccessCaches(gymId: string) {
  await Promise.all([
    deleteCacheKeysByPrefix(`access:gym:${gymId}:`),
    deleteCacheKeysByPrefix(`gym:member:${gymId}:`),
    deleteCacheKeysByPrefix(`gym:inventory:${gymId}:`),
    deleteCacheKeysByPrefix(`bootstrap:gym:${gymId}:`),
  ]);
}

function buildAnomalyMetadata(
  metadata: Record<string, unknown> | null,
  anomaly: string,
) {
  return {
    ...(metadata ?? {}),
    anomaly,
  };
}

export class AccessService {
  static async listDevices(gymId: string) {
    const devices = await db.accessDevice.findMany({
      where: { gymId },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });

    return devices.map((device) => toAccessDeviceSnapshot(device));
  }

  static async createDevice(
    gymId: string,
    input: {
      name: string;
      vendorKey: string;
      adapterKey: string;
      hardwareType: string;
      authModes: string[];
      transport: "webhook" | "bridge" | "manual";
      status: "active" | "paused" | "offline" | "error";
      externalDeviceId?: string | null;
      externalSerial?: string | null;
      directionMode: string;
      dedupeWindowSeconds: number;
      payloadTemplate?: AccessPayloadTemplate | null;
      settings?: Record<string, unknown> | null;
    },
  ) {
    const ingestionKey = randomBytes(12).toString("hex");
    const secret = randomBytes(16).toString("hex");

    const device = await db.accessDevice.create({
      data: {
        gymId,
        name: input.name,
        vendorKey: input.vendorKey,
        adapterKey: input.adapterKey,
        hardwareType: input.hardwareType,
        authModes: input.authModes,
        transport: input.transport,
        status: input.status,
        externalDeviceId: input.externalDeviceId,
        externalSerial: input.externalSerial,
        directionMode: input.directionMode,
        dedupeWindowSeconds: input.dedupeWindowSeconds,
        payloadTemplate: toPrismaJson(input.payloadTemplate),
        settings: toPrismaJson(input.settings),
        ingestionKey,
        secretHash: hashAccessSecret(secret),
      },
    });

    await invalidateAccessCaches(gymId);

    return {
      device: toAccessDeviceSnapshot(device),
      setup: {
        ingestionKey,
        secret,
      },
    };
  }

  static async updateDevice(
    gymId: string,
    deviceId: string,
    input: Partial<{
      name: string;
      vendorKey: string;
      adapterKey: string;
      hardwareType: string;
      authModes: string[];
      transport: "webhook" | "bridge" | "manual";
      status: "active" | "paused" | "offline" | "error";
      externalDeviceId?: string | null;
      externalSerial?: string | null;
      directionMode: string;
      dedupeWindowSeconds: number;
      payloadTemplate?: AccessPayloadTemplate | null;
      settings?: Record<string, unknown> | null;
    }>,
  ) {
    const existing = await db.accessDevice.findFirst({
      where: { id: deviceId, gymId },
    });

    if (!existing) {
      throw new Error("Dispositivo não encontrado");
    }

    const device = await db.accessDevice.update({
      where: { id: deviceId },
      data: {
        name: input.name,
        vendorKey: input.vendorKey,
        adapterKey: input.adapterKey,
        hardwareType: input.hardwareType,
        authModes: input.authModes,
        transport: input.transport,
        status: input.status,
        externalDeviceId: input.externalDeviceId,
        externalSerial: input.externalSerial,
        directionMode: input.directionMode,
        dedupeWindowSeconds: input.dedupeWindowSeconds,
        payloadTemplate: toPrismaJson(input.payloadTemplate),
        settings: toPrismaJson(input.settings),
      },
    });

    await invalidateAccessCaches(gymId);
    return toAccessDeviceSnapshot(device);
  }

  static async listBindings(gymId: string) {
    const bindings = await db.accessCredentialBinding.findMany({
      where: { gymId, isActive: true },
      include: {
        student: { include: { user: true } },
        personal: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return bindings.map((binding) => toBindingSnapshot(binding));
  }

  static async createBinding(
    gymId: string,
    input: {
      subjectType: AccessSubjectType;
      subjectId: string;
      identifierType: string;
      identifierValue: string;
      providerKey?: string | null;
      deviceId?: string | null;
      metadata?: Record<string, unknown> | null;
    },
  ) {
    const subject = await this.resolveManualSubject(
      gymId,
      input.subjectType,
      input.subjectId,
    );

    const data = {
      gymId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      studentId: subject.studentId,
      personalId: subject.personalId,
      providerKey: input.providerKey,
      deviceId: input.deviceId,
      identifierType: input.identifierType,
      identifierValue: input.identifierValue,
      isActive: true,
      metadata: toPrismaJson(input.metadata),
    };

    const binding = await db.accessCredentialBinding.upsert({
      where: {
        gymId_identifierType_identifierValue: {
          gymId,
          identifierType: input.identifierType,
          identifierValue: input.identifierValue,
        },
      },
      create: data,
      update: data,
      include: {
        student: { include: { user: true } },
        personal: true,
      },
    });

    await invalidateAccessCaches(gymId);
    return toBindingSnapshot(binding);
  }

  static async getFeed(
    gymId: string,
    options?: {
      status?: AccessEventStatus;
      subjectType?: AccessSubjectType;
      limit?: number;
    },
  ) {
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const cacheKey = buildAccessCacheKey(
      gymId,
      "feed",
      [
        options?.status ?? "all",
        options?.subjectType ?? "all",
        String(limit),
      ].join(":"),
    );

    const cached = await getCachedJson<AccessEventFeedItem[]>(cacheKey);
    if (cached) {
      return cached.map((item) => ({
        ...item,
        occurredAt: new Date(item.occurredAt),
      }));
    }

    const events = await db.accessEvent.findMany({
      where: {
        gymId,
        status: options?.status,
        subjectType: options?.subjectType,
      },
      include: {
        device: { select: { name: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });

    const payload = events.map((event) => toAccessFeedItem(event));
    await setCachedJson(cacheKey, payload, ACCESS_CACHE_TTL_SECONDS);
    return payload;
  }

  static async getPendingEvents(gymId: string) {
    return this.getFeed(gymId, {
      limit: 100,
      status: "pending_match",
    });
  }

  static async getPresence(gymId: string): Promise<AccessPresenceGroup> {
    const cacheKey = buildAccessCacheKey(gymId, "presence");
    const cached = await getCachedJson<AccessPresenceGroup>(cacheKey);
    if (cached) {
      return {
        students: cached.students.map((session) => ({
          ...session,
          entryAt: new Date(session.entryAt),
          exitAt: session.exitAt ? new Date(session.exitAt) : null,
        })),
        personals: cached.personals.map((session) => ({
          ...session,
          entryAt: new Date(session.entryAt),
          exitAt: session.exitAt ? new Date(session.exitAt) : null,
        })),
      };
    }

    const sessions = await db.presenceSession.findMany({
      where: {
        gymId,
        status: "open",
      },
      orderBy: { entryAt: "desc" },
    });

    const normalized = sessions.map((session) => toPresenceSessionRecord(session));
    const payload = {
      students: normalized.filter((session) => session.subjectType === "STUDENT"),
      personals: normalized.filter(
        (session) => session.subjectType === "PERSONAL",
      ),
    };

    await setCachedJson(cacheKey, payload, ACCESS_CACHE_TTL_SECONDS);
    return payload;
  }

  static async getOverview(gymId: string): Promise<AccessOverview> {
    const cacheKey = buildAccessCacheKey(gymId, "overview");
    const cached = await getCachedJson<AccessOverview>(cacheKey);
    if (cached) {
      return {
        ...cached,
        recentFeed: cached.recentFeed.map((item) => ({
          ...item,
          occurredAt: new Date(item.occurredAt),
        })),
      };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [presence, recentFeed, unresolvedEvents, anomalousEvents, devices] =
      await Promise.all([
        this.getPresence(gymId),
        this.getFeed(gymId, { limit: 12 }),
        db.accessEvent.count({
          where: { gymId, status: "pending_match" },
        }),
        db.accessEvent.count({
          where: { gymId, status: "anomalous" },
        }),
        db.accessDevice.findMany({
          where: { gymId },
          select: { id: true, status: true },
        }),
      ]);

    const [entriesToday, exitsToday] = await Promise.all([
      db.accessEvent.count({
        where: {
          gymId,
          occurredAt: { gte: startOfToday },
          status: "applied",
          directionResolved: "entry",
        },
      }),
      db.accessEvent.count({
        where: {
          gymId,
          occurredAt: { gte: startOfToday },
          status: "applied",
          directionResolved: "exit",
        },
      }),
    ]);

    const payload = {
      gymId,
      occupancyNow: presence.students.length + presence.personals.length,
      activeStudents: presence.students.length,
      activePersonals: presence.personals.length,
      entriesToday,
      exitsToday,
      unresolvedEvents,
      anomalousEvents,
      offlineDevices: devices.filter((device) => device.status === "offline")
        .length,
      totalDevices: devices.length,
      personPresentNow: presence.personals.length,
      recentFeed,
    };

    await setCachedJson(cacheKey, payload, ACCESS_CACHE_TTL_SECONDS);
    return payload;
  }

  static async getLegacyRecentCheckIns(
    gymId: string,
  ): Promise<LegacyCheckInProjection[]> {
    const cacheKey = buildAccessCacheKey(gymId, "legacy-recent-checkins");
    const cached = await getCachedJson<LegacyCheckInProjection[]>(cacheKey);
    if (cached) {
      return cached.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
        checkOut: item.checkOut ? new Date(item.checkOut) : undefined,
      }));
    }

    const sessions = await db.presenceSession.findMany({
      where: { gymId, subjectType: "STUDENT" },
      orderBy: { entryAt: "desc" },
      take: 20,
    });

    const payload = sessions
      .map((session) => projectSessionToLegacyCheckIn(toPresenceSessionRecord(session)))
      .filter((session): session is LegacyCheckInProjection => session != null);

    await setCachedJson(cacheKey, payload, LEGACY_RECENT_CHECKINS_TTL_SECONDS);
    return payload;
  }

  static async getLegacyStatsSnapshot(gymId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayCheckIns, activeStudents] = await Promise.all([
      db.accessEvent.count({
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "applied",
          directionResolved: "entry",
          occurredAt: { gte: startOfToday },
        },
      }),
      db.presenceSession.count({
        where: {
          gymId,
          subjectType: "STUDENT",
          status: "open",
        },
      }),
    ]);

    return {
      todayCheckIns,
      activeStudents,
    };
  }

  static async ingestDeviceEvent(
    ingestionKey: string,
    payload: Record<string, unknown>,
    headers: Record<string, string>,
    sourceIp?: string | null,
  ) {
    const device = await db.accessDevice.findUnique({
      where: { ingestionKey },
    });

    if (!device) {
      throw new Error("Integração não encontrada");
    }

    if (device.status === "paused") {
      throw new Error("Integração pausada");
    }

    const secretHeader = headers["x-access-secret"] ?? headers["x-device-secret"];
    if (
      !verifyAccessSecret({
        candidate: secretHeader,
        secretHash: device.secretHash,
      })
    ) {
      throw new Error("Segredo inválido");
    }

    const rawEvent = await db.accessRawEvent.create({
      data: {
        gymId: device.gymId,
        deviceId: device.id,
        providerKey: device.vendorKey,
        payload: payload as Prisma.InputJsonValue,
        headers: toPrismaJson(headers),
        sourceIp,
        signatureValid: secretHeader ? true : null,
      },
    });

    await accessEventQueue.add(
      "process-access-event",
      { rawEventId: rawEvent.id },
      { jobId: rawEvent.id },
    );

    return {
      rawEventId: rawEvent.id,
      deviceId: device.id,
      accepted: true,
    };
  }

  static async processRawEvent(rawEventId: string) {
    const rawEvent = await db.accessRawEvent.findUnique({
      where: { id: rawEventId },
      include: { device: true },
    });

    if (!rawEvent) {
      throw new Error("Evento bruto não encontrado");
    }

    if (!rawEvent.device) {
      await db.accessRawEvent.update({
        where: { id: rawEvent.id },
        data: {
          status: "failed",
          processingError: "Dispositivo não encontrado",
          processedAt: new Date(),
        },
      });
      return null;
    }

    const device = toAccessDeviceSnapshot(rawEvent.device);
    const normalized = normalizeTemplatePayload(
      rawEvent.payload,
      device.payloadTemplate,
    );
    const dedupeKey = buildAccessDedupeKey({
      gymId: rawEvent.gymId,
      deviceId: rawEvent.deviceId,
      providerEventId:
        typeof normalized.providerEventId === "string"
          ? normalized.providerEventId
          : null,
      identifierType: normalized.identifierType,
      identifierValue: normalized.identifierValue,
      occurredAt: normalized.occurredAt,
    });

    const duplicate = await db.accessEvent.findUnique({
      where: { dedupeKey },
    });

    if (duplicate) {
      await db.accessRawEvent.update({
        where: { id: rawEvent.id },
        data: {
          providerEventId:
            typeof normalized.providerEventId === "string"
              ? normalized.providerEventId
              : null,
          status: "duplicate",
          processedAt: new Date(),
          processingError: null,
        },
      });

      await this.touchDeviceActivity(
        rawEvent.deviceId,
        normalized.occurredAt,
        rawEvent.device.status,
      );

      return duplicate;
    }

    const matchedSubject = await this.matchSubject(rawEvent.gymId, {
      identifierType: normalized.identifierType,
      identifierValue: normalized.identifierValue,
    });

    if (!matchedSubject) {
      const pendingEvent = await db.accessEvent.create({
        data: {
          gymId: rawEvent.gymId,
          deviceId: rawEvent.deviceId,
          rawEventId: rawEvent.id,
          source: "device",
          status: "pending_match",
          confidence: "unmatched",
          providerKey: rawEvent.providerKey,
          providerEventId:
            typeof normalized.providerEventId === "string"
              ? normalized.providerEventId
              : null,
          dedupeKey,
          identifierType: normalized.identifierType,
          identifierValue: normalized.identifierValue,
          directionReceived: normalized.directionReceived,
          directionResolved: "unknown",
          occurredAt: normalized.occurredAt,
          metadata: toPrismaJson(normalized.metadata),
        },
      });

      await db.accessRawEvent.update({
        where: { id: rawEvent.id },
        data: {
          providerEventId:
            typeof normalized.providerEventId === "string"
              ? normalized.providerEventId
              : null,
          status: "pending_match",
          processedAt: new Date(),
          processingError: null,
        },
      });

      await this.touchDeviceActivity(
        rawEvent.deviceId,
        normalized.occurredAt,
        rawEvent.device.status,
      );

      await invalidateAccessCaches(rawEvent.gymId);
      return pendingEvent;
    }

    const applied = await db.$transaction(async (tx) => {
      const openSession = await this.findOpenSession(
        tx,
        rawEvent.gymId,
        matchedSubject,
      );

      const resolution = resolveAccessDirection({
        providerDirection: normalized.directionReceived,
        directionMode: device.directionMode,
        hasOpenSession: !!openSession,
      });

      if (resolution.direction === "exit" && !openSession) {
        return tx.accessEvent.create({
          data: {
            gymId: rawEvent.gymId,
            deviceId: rawEvent.deviceId,
            rawEventId: rawEvent.id,
            subjectType: matchedSubject.subjectType,
            subjectId: matchedSubject.subjectId,
            studentId: matchedSubject.studentId,
            personalId: matchedSubject.personalId,
            subjectName: matchedSubject.subjectName,
            source: "device",
            status: "anomalous",
            confidence: resolution.inferred ? "inferred" : "exact",
            providerKey: rawEvent.providerKey,
            providerEventId:
              typeof normalized.providerEventId === "string"
                ? normalized.providerEventId
                : null,
            dedupeKey,
            identifierType: normalized.identifierType,
            identifierValue: normalized.identifierValue,
            directionReceived: normalized.directionReceived,
            directionResolved: resolution.direction,
            occurredAt: normalized.occurredAt,
            metadata: toPrismaJson(
              buildAnomalyMetadata(
                toJsonRecord(normalized.metadata),
                "exit_without_open_session",
              ),
            ),
          },
        });
      }

      const event = await tx.accessEvent.create({
        data: {
          gymId: rawEvent.gymId,
          deviceId: rawEvent.deviceId,
          rawEventId: rawEvent.id,
          subjectType: matchedSubject.subjectType,
          subjectId: matchedSubject.subjectId,
          studentId: matchedSubject.studentId,
          personalId: matchedSubject.personalId,
          subjectName: matchedSubject.subjectName,
          source: "device",
          status: "applied",
          confidence: resolution.inferred ? "inferred" : "exact",
          providerKey: rawEvent.providerKey,
          providerEventId:
            typeof normalized.providerEventId === "string"
              ? normalized.providerEventId
              : null,
          dedupeKey,
          identifierType: normalized.identifierType,
          identifierValue: normalized.identifierValue,
          directionReceived: normalized.directionReceived,
          directionResolved: resolution.direction,
          occurredAt: normalized.occurredAt,
          metadata: toPrismaJson(normalized.metadata),
        },
      });

      if (resolution.direction === "entry") {
        if (openSession) {
          return tx.accessEvent.update({
            where: { id: event.id },
            data: {
              status: "anomalous",
              metadata: toPrismaJson(
                buildAnomalyMetadata(
                  toJsonRecord(normalized.metadata),
                  "entry_with_existing_open_session",
                ),
              ),
            },
          });
        }

        await tx.presenceSession.create({
          data: {
            gymId: rawEvent.gymId,
            subjectType: matchedSubject.subjectType,
            subjectId: matchedSubject.subjectId,
            studentId: matchedSubject.studentId,
            personalId: matchedSubject.personalId,
            subjectName: matchedSubject.subjectName,
            status: "open",
            entryAt: normalized.occurredAt,
            openedBySource: "device",
            entryDeviceId: rawEvent.deviceId,
            inferenceFlags: resolution.inferred
              ? toPrismaJson({ direction: "inferred_auto" })
              : undefined,
          },
        });
      } else {
        await tx.presenceSession.update({
          where: { id: openSession!.id },
          data: {
            status: "closed",
            exitAt: normalized.occurredAt,
            closedBySource: "device",
            exitDeviceId: rawEvent.deviceId,
            inferenceFlags: resolution.inferred
              ? toPrismaJson({
                  ...(toJsonRecord(openSession!.inferenceFlags) ?? {}),
                  direction: "inferred_auto",
                })
              : openSession!.inferenceFlags ?? undefined,
          },
        });
      }

      return event;
    });

    await db.accessRawEvent.update({
      where: { id: rawEvent.id },
      data: {
        providerEventId:
          typeof normalized.providerEventId === "string"
            ? normalized.providerEventId
            : null,
        status: applied?.status ?? "applied",
        processedAt: new Date(),
        processingError: null,
      },
    });

    await this.touchDeviceActivity(
      rawEvent.deviceId,
      normalized.occurredAt,
      rawEvent.device.status,
    );

    await invalidateAccessCaches(rawEvent.gymId);
    return applied;
  }

  static async reconcileEvent(
    gymId: string,
    eventId: string,
    input: {
      action: "apply" | "ignore";
      subjectType?: AccessSubjectType;
      subjectId?: string;
      createBinding: boolean;
    },
  ) {
    const event = await db.accessEvent.findFirst({
      where: { id: eventId, gymId },
    });

    if (!event) {
      throw new Error("Evento não encontrado");
    }

    if (input.action === "ignore") {
      const ignored = await db.accessEvent.update({
        where: { id: event.id },
        data: { status: "ignored" },
      });
      await invalidateAccessCaches(gymId);
      return ignored;
    }

    if (!input.subjectType || !input.subjectId) {
      throw new Error("subjectType e subjectId são obrigatórios");
    }

    const subject = await this.resolveManualSubject(
      gymId,
      input.subjectType,
      input.subjectId,
    );

    const updated = await db.$transaction(async (tx) => {
      const openSession = await this.findOpenSession(tx, gymId, subject);
      const direction =
        event.directionResolved !== "unknown"
          ? event.directionResolved
          : event.directionReceived !== "unknown"
            ? event.directionReceived
            : openSession
              ? "exit"
              : "entry";

      const baseUpdate = {
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        studentId: subject.studentId,
        personalId: subject.personalId,
        subjectName: subject.subjectName,
        confidence: "manual_reconciliation",
        directionResolved: direction,
      };

      if (direction === "exit" && !openSession) {
        return tx.accessEvent.update({
          where: { id: event.id },
          data: {
            ...baseUpdate,
            status: "anomalous",
            metadata: toPrismaJson(
              buildAnomalyMetadata(
                toJsonRecord(event.metadata),
                "exit_without_open_session",
              ),
            ),
          },
        });
      }

      if (direction === "entry" && openSession) {
        return tx.accessEvent.update({
          where: { id: event.id },
          data: {
            ...baseUpdate,
            status: "anomalous",
            metadata: toPrismaJson(
              buildAnomalyMetadata(
                toJsonRecord(event.metadata),
                "entry_with_existing_open_session",
              ),
            ),
          },
        });
      }

      const applied = await tx.accessEvent.update({
        where: { id: event.id },
        data: {
          ...baseUpdate,
          status: "applied",
        },
      });

      if (direction === "entry") {
        await tx.presenceSession.create({
          data: {
            gymId,
            subjectType: subject.subjectType,
            subjectId: subject.subjectId,
            studentId: subject.studentId,
            personalId: subject.personalId,
            subjectName: subject.subjectName,
            status: "open",
            entryAt: event.occurredAt,
            openedBySource: event.source,
            entryDeviceId: event.deviceId,
            inferenceFlags:
              event.directionReceived === "unknown"
                ? toPrismaJson({ direction: "inferred_auto" })
                : undefined,
          },
        });
      } else {
        await tx.presenceSession.update({
          where: { id: openSession!.id },
          data: {
            status: event.source === "device" ? "closed" : "manually_closed",
            exitAt: event.occurredAt,
            closedBySource: event.source,
            exitDeviceId: event.deviceId,
          },
        });
      }

      return applied;
    });

    if (input.createBinding && event.identifierType && event.identifierValue) {
      await this.createBinding(gymId, {
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        identifierType: event.identifierType,
        identifierValue: event.identifierValue,
        providerKey: event.providerKey,
        deviceId: event.deviceId,
      });
    } else {
      await invalidateAccessCaches(gymId);
    }

    return updated;
  }

  static async createManualEventForGym(
    gymId: string,
    input: {
      subjectType: AccessSubjectType;
      subjectId: string;
      direction: Exclude<AccessDirection, "unknown">;
      reason?: string | null;
    },
    actor: AccessActor,
  ) {
    const subject = await this.resolveManualSubject(
      gymId,
      input.subjectType,
      input.subjectId,
    );

    const event = await this.applyManualEvent(gymId, input, actor, subject);
    await invalidateAccessCaches(gymId);
    return event;
  }

  static async createManualEventForPersonal(
    gymId: string,
    personalId: string,
    input: {
      subjectType: AccessSubjectType;
      subjectId: string;
      direction: Exclude<AccessDirection, "unknown">;
      reason?: string | null;
    },
    actor: AccessActor,
  ) {
    if (input.subjectType !== "STUDENT") {
      throw new Error("Personal só pode operar alunos manualmente");
    }

    const assignment = await db.studentPersonalAssignment.findFirst({
      where: {
        gymId,
        personalId,
        studentId: input.subjectId,
        status: "active",
      },
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    if (!assignment) {
      throw new Error("Aluno não vinculado a este personal nesta academia");
    }

    const event = await this.applyManualEvent(
      gymId,
      input,
      actor,
      {
        subjectType: "STUDENT",
        subjectId: assignment.studentId,
        studentId: assignment.studentId,
        subjectName: assignment.student.user.name,
      },
    );

    await invalidateAccessCaches(gymId);
    return event;
  }

  static async createLegacyGymCheckIn(gymId: string, studentId: string) {
    const event = await this.createManualEventForGym(
      gymId,
      {
        subjectType: "STUDENT",
        subjectId: studentId,
        direction: "entry",
        reason: "legacy_checkin",
      },
      {
        actorRole: "GYM",
      },
    );

    const session = await db.presenceSession.findFirst({
      where: {
        gymId,
        subjectType: "STUDENT",
        studentId,
        status: "open",
      },
      orderBy: { entryAt: "desc" },
    });

    if (!session) {
      throw new Error("Não foi possível abrir a sessão de presença");
    }

    const projection = projectSessionToLegacyCheckIn(
      toPresenceSessionRecord(session),
    );

    if (!projection) {
      throw new Error("Não foi possível projetar o check-in");
    }

    return { event, checkIn: projection };
  }

  static async closeLegacyGymCheckIn(gymId: string, sessionId: string) {
    const session = await db.presenceSession.findFirst({
      where: {
        id: sessionId,
        gymId,
        subjectType: "STUDENT",
      },
    });

    if (!session) {
      throw new Error("Check-in não encontrado");
    }

    await this.createManualEventForGym(
      gymId,
      {
        subjectType: "STUDENT",
        subjectId: session.studentId ?? session.subjectId,
        direction: "exit",
        reason: "legacy_checkout",
      },
      {
        actorRole: "GYM",
      },
    );

    const updated = await db.presenceSession.findUnique({
      where: { id: session.id },
    });

    if (!updated) {
      throw new Error("Sessão de presença não encontrada após checkout");
    }

    const projection = projectSessionToLegacyCheckIn(
      toPresenceSessionRecord(updated),
    );

    if (!projection) {
      throw new Error("Não foi possível projetar o check-out");
    }

    return projection;
  }

  private static async touchDeviceActivity(
    deviceId: string | null | undefined,
    occurredAt: Date,
    previousStatus?: "active" | "paused" | "offline" | "error" | null,
  ) {
    if (!deviceId) {
      return;
    }

    await db.accessDevice.update({
      where: { id: deviceId },
      data: {
        lastEventAt: occurredAt,
        lastHeartbeatAt: new Date(),
        status: previousStatus === "paused" ? "paused" : "active",
      },
    });
  }

  private static async findOpenSession(
    tx: TransactionClient,
    gymId: string,
    subject: MatchedSubject,
  ) {
    return tx.presenceSession.findFirst({
      where: {
        gymId,
        subjectType: subject.subjectType,
        subjectId: subject.subjectId,
        status: "open",
      },
      orderBy: { entryAt: "desc" },
    });
  }

  private static async matchSubject(
    gymId: string,
    input: {
      identifierType?: string | null;
      identifierValue?: string | null;
    },
  ): Promise<MatchedSubject | null> {
    const identifierValue = input.identifierValue?.trim();
    if (!identifierValue) {
      return null;
    }

    const binding = await db.accessCredentialBinding.findFirst({
      where: {
        gymId,
        isActive: true,
        identifierValue,
        ...(input.identifierType
          ? {
              identifierType: input.identifierType,
            }
          : {}),
      },
      include: {
        student: { include: { user: true } },
        personal: true,
      },
    });

    if (binding) {
      return toSubjectFromBinding(binding);
    }

    const normalizedType = input.identifierType?.toLowerCase() ?? "";

    if (
      normalizedType === "student_id" ||
      normalizedType === "studentid" ||
      normalizedType === "student" ||
      normalizedType === "matricula"
    ) {
      const membership = await db.gymMembership.findFirst({
        where: {
          gymId,
          studentId: identifierValue,
          status: { in: ["active", "pending"] },
        },
        include: {
          student: { include: { user: true } },
        },
      });

      if (membership) {
        return {
          subjectType: "STUDENT",
          subjectId: membership.studentId,
          studentId: membership.studentId,
          subjectName: membership.student.user.name,
        };
      }
    }

    if (
      normalizedType === "personal_id" ||
      normalizedType === "personalid" ||
      normalizedType === "personal"
    ) {
      const affiliation = await db.gymPersonalAffiliation.findFirst({
        where: {
          gymId,
          personalId: identifierValue,
          status: "active",
        },
        include: {
          personal: true,
        },
      });

      if (affiliation) {
        return {
          subjectType: "PERSONAL",
          subjectId: affiliation.personalId,
          personalId: affiliation.personalId,
          subjectName: affiliation.personal.name,
        };
      }
    }

    return null;
  }

  private static async resolveManualSubject(
    gymId: string,
    subjectType: AccessSubjectType,
    subjectId: string,
  ): Promise<MatchedSubject> {
    if (subjectType === "STUDENT") {
      const membership = await db.gymMembership.findFirst({
        where: {
          gymId,
          studentId: subjectId,
          status: { in: ["active", "pending"] },
        },
        include: {
          student: { include: { user: true } },
        },
      });

      if (!membership) {
        throw new Error("Aluno não encontrado ou sem vínculo ativo");
      }

      return {
        subjectType: "STUDENT",
        subjectId: membership.studentId,
        studentId: membership.studentId,
        subjectName: membership.student.user.name,
      };
    }

    const affiliation = await db.gymPersonalAffiliation.findFirst({
      where: {
        gymId,
        personalId: subjectId,
        status: "active",
      },
      include: { personal: true },
    });

    if (!affiliation) {
      throw new Error("Personal não encontrado ou sem afiliação ativa");
    }

    return {
      subjectType: "PERSONAL",
      subjectId: affiliation.personalId,
      personalId: affiliation.personalId,
      subjectName: affiliation.personal.name,
    };
  }

  private static async applyManualEvent(
    gymId: string,
    input: {
      subjectType: AccessSubjectType;
      subjectId: string;
      direction: Exclude<AccessDirection, "unknown">;
      reason?: string | null;
    },
    actor: AccessActor,
    subject: MatchedSubject,
  ) {
    const occurredAt = new Date();
    const dedupeKey = buildAccessDedupeKey({
      gymId,
      deviceId: null,
      identifierType: `${input.subjectType.toLowerCase()}_manual`,
      identifierValue: `${input.subjectId}:${input.direction}:${occurredAt.toISOString()}`,
      occurredAt,
    });

    return db.$transaction(async (tx) => {
      const openSession = await this.findOpenSession(tx, gymId, subject);

      if (input.direction === "entry" && openSession) {
        throw new Error("Já existe presença aberta para este usuário");
      }

      if (input.direction === "exit" && !openSession) {
        throw new Error("Não existe presença aberta para encerrar");
      }

      const source =
        actor.actorRole === "PERSONAL" ? "manual_personal" : "manual_gym";

      const event = await tx.accessEvent.create({
        data: {
          gymId,
          subjectType: subject.subjectType,
          subjectId: subject.subjectId,
          studentId: subject.studentId,
          personalId: subject.personalId,
          subjectName: subject.subjectName,
          source,
          status: "applied",
          confidence: "manual",
          dedupeKey,
          identifierType: `${input.subjectType.toLowerCase()}_manual`,
          identifierValue: input.subjectId,
          directionReceived: input.direction,
          directionResolved: input.direction,
          occurredAt,
          actorRole: actor.actorRole,
          actorUserId: actor.actorUserId ?? null,
          manualReason: input.reason ?? null,
        },
      });

      if (input.direction === "entry") {
        await tx.presenceSession.create({
          data: {
            gymId,
            subjectType: subject.subjectType,
            subjectId: subject.subjectId,
            studentId: subject.studentId,
            personalId: subject.personalId,
            subjectName: subject.subjectName,
            status: "open",
            entryAt: occurredAt,
            openedBySource: source,
          },
        });
      } else {
        await tx.presenceSession.update({
          where: { id: openSession!.id },
          data: {
            status: "manually_closed",
            exitAt: occurredAt,
            closedBySource: source,
          },
        });
      }

      return event;
    });
  }
}

export type AccessEventQueuePayload = {
  rawEventId: string;
};

export function createHeaderSnapshot(headers: Headers) {
  return Object.fromEntries(
    [...headers.entries()].map(([key, value]) => [key.toLowerCase(), value]),
  );
}

export function logAccessProcessingError(scope: string, error: unknown) {
  log.error(`[access] ${scope}`, {
    error: error instanceof Error ? error.message : String(error),
  });
}
