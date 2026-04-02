import { db } from "@/lib/db";
import { persistBusinessEvent } from "@/lib/observability";
import { log } from "@/lib/observability";
import { getRequestId } from "@/lib/runtime/request-context";
import type { NextRequest } from "@/runtime/next-server";
import { getRequestIp, getRequestUserAgent } from "./request-meta";

export type AuditAction =
  | "AUTH:LOGIN"
  | "AUTH:LOGOUT"
  | "AUTH:FAILED_LOGIN"
  | "AUTH:PASSWORD_RESET"
  | "ROLE:CHANGED"
  | "ROLE:ESCALATION_ATTEMPT"
  | "PAYMENT:INITIATED"
  | "PAYMENT:COMPLETED"
  | "PAYMENT:FAILED"
  | "PAYMENT:WEBHOOK"
  | "SUBSCRIPTION:ACTIVATED"
  | "SUBSCRIPTION:CANCELLED"
  | "DATA:EXPORTED"
  | "DATA:DELETED"
  | "ADMIN:ACTION"
  | "SECURITY:RATE_LIMITED"
  | "SECURITY:FORBIDDEN";

export type AuditResult = "SUCCESS" | "FAILURE";

export interface AuditEntry {
  action: AuditAction;
  actorId: string | null;
  targetId: string | null;
  ip: string;
  userAgent: string;
  requestId: string | null;
  payload: Record<string, unknown>;
  result: AuditResult;
  occurredAt: Date;
}

type AuditInput = {
  action: AuditAction;
  actorId?: string | null;
  targetId?: string | null;
  request?: Pick<NextRequest, "headers"> | Headers;
  ip?: string;
  userAgent?: string;
  requestId?: string | null;
  payload?: Record<string, unknown>;
  result: AuditResult;
  occurredAt?: Date;
};

function toAuditEntry(input: AuditInput): AuditEntry {
  const headers = input.request
    ? input.request instanceof Headers
      ? input.request
      : input.request.headers
    : null;

  return {
    action: input.action,
    actorId: input.actorId ?? null,
    targetId: input.targetId ?? null,
    ip: input.ip ?? (headers ? getRequestIp(headers) : "127.0.0.1"),
    userAgent:
      input.userAgent ?? (headers ? getRequestUserAgent(headers) : "unknown"),
    requestId: input.requestId ?? getRequestId(),
    payload: input.payload ?? {},
    result: input.result,
    occurredAt: input.occurredAt ?? new Date(),
  };
}

export async function auditLog(input: AuditInput) {
  const entry = toAuditEntry(input);
  const auditLogClient = db as typeof db & {
    auditLog: {
      create: (args: {
        data: {
          action: AuditEntry["action"];
          actorId: string | null;
          targetId: string | null;
          ip: string;
          userAgent: string;
          requestId: string | null;
          payload: Record<string, unknown>;
          result: AuditEntry["result"];
          occurredAt: Date;
        };
      }) => Promise<unknown>;
    };
  };

  try {
    await auditLogClient.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId,
        targetId: entry.targetId,
        ip: entry.ip,
        userAgent: entry.userAgent,
        requestId: entry.requestId,
        payload: entry.payload,
        result: entry.result,
        occurredAt: entry.occurredAt,
      },
    });
  } catch (error) {
    log.debug("Audit log persistence skipped", {
      action: entry.action,
      error: error instanceof Error ? error.message : "unknown",
    });
  }

  await persistBusinessEvent({
    eventType: `audit.${entry.action.toLowerCase().replaceAll(":", ".")}`,
    domain: "security",
    actorId: entry.actorId,
    requestId: entry.requestId,
    status: entry.result === "SUCCESS" ? "success" : "failure",
    payload: {
      targetId: entry.targetId,
      ip: entry.ip,
      userAgent: entry.userAgent,
      result: entry.result,
      ...entry.payload,
    },
    occurredAt: entry.occurredAt,
  });
}
