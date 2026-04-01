import type { CheckIn } from "./core";

export type AccessSubjectType = "STUDENT" | "PERSONAL";
export type AccessTransport = "webhook" | "bridge" | "manual";
export type AccessDeviceStatus = "active" | "paused" | "offline" | "error";
export type AccessDirection = "entry" | "exit" | "unknown";
export type AccessDirectionMode = "provider" | "entry" | "exit" | "auto";
export type AccessEventSource =
  | "device"
  | "manual_gym"
  | "manual_personal"
  | "legacy_import"
  | "app_mobile";
export type AccessEventStatus =
  | "pending_match"
  | "applied"
  | "duplicate"
  | "ignored"
  | "anomalous";
export type PresenceSessionStatus =
  | "open"
  | "closed"
  | "manually_closed"
  | "anomalous";

export interface AccessPayloadTemplate {
  eventIdPath?: string | null;
  deviceIdPath?: string | null;
  occurredAtPath?: string | null;
  identifierValuePath?: string | null;
  identifierTypePath?: string | null;
  directionPath?: string | null;
  resultPath?: string | null;
  heartbeatPath?: string | null;
  metadataPaths?: Record<string, string>;
  staticMetadata?: Record<string, unknown>;
}

export interface PresenceSubjectRef {
  subjectType: AccessSubjectType;
  subjectId: string;
  studentId?: string | null;
  personalId?: string | null;
  subjectName?: string | null;
}

export interface AccessDeviceSnapshot {
  id: string;
  gymId: string;
  name: string;
  vendorKey: string;
  adapterKey: string;
  hardwareType: string;
  authModes: string[];
  transport: AccessTransport;
  status: AccessDeviceStatus;
  externalDeviceId?: string | null;
  externalSerial?: string | null;
  directionMode: AccessDirectionMode;
  dedupeWindowSeconds: number;
  lastHeartbeatAt?: Date | null;
  lastEventAt?: Date | null;
  payloadTemplate?: AccessPayloadTemplate | null;
  settings?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessCredentialBinding extends PresenceSubjectRef {
  id: string;
  gymId: string;
  deviceId?: string | null;
  providerKey?: string | null;
  identifierType: string;
  identifierValue: string;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessEventFeedItem extends PresenceSubjectRef {
  id: string;
  gymId: string;
  deviceId?: string | null;
  deviceName?: string | null;
  vendorKey?: string | null;
  providerEventId?: string | null;
  source: AccessEventSource;
  status: AccessEventStatus;
  confidence: string;
  identifierType?: string | null;
  identifierValue?: string | null;
  directionReceived: AccessDirection;
  directionResolved: AccessDirection;
  occurredAt: Date;
  manualReason?: string | null;
  actorRole?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PresenceSessionRecord extends PresenceSubjectRef {
  id: string;
  gymId: string;
  status: PresenceSessionStatus;
  entryAt: Date;
  exitAt?: Date | null;
  openedBySource: AccessEventSource;
  closedBySource?: AccessEventSource | null;
  entryDeviceId?: string | null;
  exitDeviceId?: string | null;
  inferenceFlags?: Record<string, unknown> | null;
  legacyCheckInId?: string | null;
}

export interface AccessOverview {
  gymId: string;
  occupancyNow: number;
  activeStudents: number;
  activePersonals: number;
  entriesToday: number;
  exitsToday: number;
  unresolvedEvents: number;
  anomalousEvents: number;
  offlineDevices: number;
  totalDevices: number;
  personPresentNow: number;
  recentFeed: AccessEventFeedItem[];
}

export interface AccessPresenceGroup {
  students: PresenceSessionRecord[];
  personals: PresenceSessionRecord[];
}

export interface LegacyCheckInProjection extends CheckIn {}
