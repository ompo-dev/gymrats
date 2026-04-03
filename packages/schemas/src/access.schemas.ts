import { z } from "zod";

const accessDirectionModeEnum = z.enum(["provider", "entry", "exit", "auto"]);
const accessTransportEnum = z.enum(["webhook", "bridge", "manual"]);
const accessDeviceStatusEnum = z.enum(["active", "paused", "offline", "error"]);

export const accessPayloadTemplateSchema = z.object({
  eventIdPath: z.string().trim().min(1).optional().nullable(),
  deviceIdPath: z.string().trim().min(1).optional().nullable(),
  occurredAtPath: z.string().trim().min(1).optional().nullable(),
  identifierValuePath: z.string().trim().min(1).optional().nullable(),
  identifierTypePath: z.string().trim().min(1).optional().nullable(),
  directionPath: z.string().trim().min(1).optional().nullable(),
  resultPath: z.string().trim().min(1).optional().nullable(),
  heartbeatPath: z.string().trim().min(1).optional().nullable(),
  metadataPaths: z.record(z.string(), z.string().trim().min(1)).optional(),
  staticMetadata: z.record(z.string(), z.unknown()).optional(),
});

export const accessDeviceIdParamsSchema = z.object({
  deviceId: z.string().min(1, "deviceId é obrigatório"),
});

export const accessDevicesQuerySchema = z.object({
  status: accessDeviceStatusEnum.optional(),
});

export const createAccessDeviceSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  vendorKey: z.string().trim().min(1, "vendorKey é obrigatório"),
  adapterKey: z.string().trim().min(1).default("generic-webhook"),
  hardwareType: z.string().trim().min(1, "hardwareType é obrigatório"),
  authModes: z.array(z.string().trim().min(1)).default([]),
  transport: accessTransportEnum.default("webhook"),
  status: accessDeviceStatusEnum.default("active"),
  externalDeviceId: z.string().trim().optional().nullable(),
  externalSerial: z.string().trim().optional().nullable(),
  directionMode: accessDirectionModeEnum.default("auto"),
  dedupeWindowSeconds: z.number().int().positive().default(120),
  payloadTemplate: accessPayloadTemplateSchema.optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateAccessDeviceSchema = createAccessDeviceSchema.partial();

export const accessFeedQuerySchema = z.object({
  status: z
    .enum(["pending_match", "applied", "duplicate", "ignored", "anomalous"])
    .optional(),
  subjectType: z.enum(["STUDENT", "PERSONAL"]).optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional(),
});

export const accessManualEventSchema = z.object({
  subjectType: z.enum(["STUDENT", "PERSONAL"]),
  subjectId: z.string().min(1, "subjectId é obrigatório"),
  direction: z.enum(["entry", "exit"]),
  reason: z.string().trim().max(280).optional().nullable(),
});

export const accessCredentialBindingSchema = z.object({
  subjectType: z.enum(["STUDENT", "PERSONAL"]),
  subjectId: z.string().min(1, "subjectId é obrigatório"),
  identifierType: z.string().trim().min(1, "identifierType é obrigatório"),
  identifierValue: z.string().trim().min(1, "identifierValue é obrigatório"),
  providerKey: z.string().trim().optional().nullable(),
  deviceId: z.string().trim().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const accessEventIdParamsSchema = z.object({
  eventId: z.string().min(1, "eventId é obrigatório"),
});

export const accessReconcileEventSchema = z.object({
  action: z.enum(["apply", "ignore"]).default("apply"),
  subjectType: z.enum(["STUDENT", "PERSONAL"]).optional(),
  subjectId: z.string().optional(),
  createBinding: z.boolean().default(true),
});

export const accessWebhookParamsSchema = z.object({
  ingestionKey: z.string().min(1, "ingestionKey é obrigatório"),
});

export const accessAuthorizationRequestSchema = z.object({
  requestId: z.string().trim().optional().nullable(),
  occurredAt: z.string().datetime().optional().nullable(),
  deviceId: z.string().trim().optional().nullable(),
  identifierType: z.string().trim().min(1, "identifierType é obrigatório"),
  identifierValue: z.string().trim().min(1, "identifierValue é obrigatório"),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const accessHeartbeatSchema = z.object({
  occurredAt: z.string().datetime().optional().nullable(),
  status: accessDeviceStatusEnum.optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});
