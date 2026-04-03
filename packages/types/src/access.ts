import type { CheckIn } from "./core";

export type AccessSubjectType = "STUDENT" | "PERSONAL";
export type AccessTransport = "webhook" | "bridge" | "manual";
export type AccessDeviceStatus = "active" | "paused" | "offline" | "error";
export type AccessDirection = "entry" | "exit" | "unknown";
export type AccessDirectionMode = "provider" | "entry" | "exit" | "auto";
export type AccessAuthorizationStatus =
  | "eligible"
  | "grace"
  | "blocked"
  | "inactive"
  | "unknown";
export type AccessFinancialStatus =
  | "paid"
  | "pending"
  | "overdue"
  | "not_applicable";
export type AccessAuthorizationOutcome = "allowed" | "denied" | "error";
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
  recordType?: "event" | "authorization";
  deviceId?: string | null;
  deviceName?: string | null;
  vendorKey?: string | null;
  providerEventId?: string | null;
  source: AccessEventSource;
  status: AccessEventStatus;
  confidence: string;
  authorizationOutcome?: AccessAuthorizationOutcome | null;
  authorizationStatus?: AccessAuthorizationStatus | null;
  financialStatus?: AccessFinancialStatus | null;
  reasonCode?: string | null;
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
  presentNow: number;
  entriesToday: number;
  exitsToday: number;
  allowedToday: number;
  deniedToday: number;
  graceStudents: number;
  blockedStudents: number;
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

export interface AccessEligibilitySnapshot extends PresenceSubjectRef {
  id: string;
  gymId: string;
  membershipId?: string | null;
  personalAffiliationId?: string | null;
  authorizationStatus: AccessAuthorizationStatus;
  financialStatus: AccessFinancialStatus;
  reasonCode: string;
  graceUntil?: Date | null;
  openPaymentId?: string | null;
  lastEvaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessAuthorizationAttempt extends PresenceSubjectRef {
  id: string;
  gymId: string;
  deviceId?: string | null;
  requestId?: string | null;
  providerKey?: string | null;
  source: string;
  outcome: AccessAuthorizationOutcome;
  allowed: boolean;
  authorizationStatus: AccessAuthorizationStatus;
  financialStatus: AccessFinancialStatus;
  reasonCode: string;
  identifierType?: string | null;
  identifierValue?: string | null;
  occurredAt: Date;
  decidedAt: Date;
  graceUntil?: Date | null;
  metadata?: Record<string, unknown> | null;
  errorMessage?: string | null;
}

export interface AccessAuthorizationRequest {
  requestId?: string | null;
  occurredAt?: Date | string | null;
  deviceId?: string | null;
  identifierType: string;
  identifierValue: string;
  metadata?: Record<string, unknown> | null;
}

export interface AccessAuthorizationResponse {
  allowed: boolean;
  reasonCode: string;
  subject?: PresenceSubjectRef | null;
  authorizationStatus: AccessAuthorizationStatus;
  financialStatus: AccessFinancialStatus;
  unlockWindowMs: number;
}

export interface AccessHeartbeatPayload {
  occurredAt?: Date | string | null;
  status?: AccessDeviceStatus | null;
  metadata?: Record<string, unknown> | null;
}

export interface LegacyCheckInProjection extends CheckIn {}
