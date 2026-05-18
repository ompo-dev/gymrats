import { DomainError } from "@gymrats/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "@/runtime/next-server";

const { enforceSubjectRateLimitMock, recordApiRequestMock, logErrorMock } =
  vi.hoisted(() => ({
    enforceSubjectRateLimitMock: vi.fn(),
    recordApiRequestMock: vi.fn(),
    logErrorMock: vi.fn(),
  }));

vi.mock("@/lib/security/rate-limiter", () => ({
  enforceSubjectRateLimit: enforceSubjectRateLimitMock,
}));

vi.mock("@/lib/observability", () => ({
  recordApiRequest: recordApiRequestMock,
  log: {
    error: logErrorMock,
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/runtime/request-context", () => ({
  getRequestId: vi.fn(() => null),
  recordAuthTime: vi.fn(),
  recordHandlerTime: vi.fn(),
  recordResponseTime: vi.fn(),
}));

vi.mock("../middleware/auth.middleware", () => ({
  requireAdmin: vi.fn(),
  requireGym: vi.fn(),
  requirePersonal: vi.fn(),
  requireStudent: vi.fn(),
}));

vi.mock("./idempotency-store", () => ({
  buildIdempotencyFingerprint: vi.fn(),
  completeIdempotencyKey: vi.fn(),
  failIdempotencyKey: vi.fn(),
  getReplayRecord: vi.fn(),
  reserveIdempotencyKey: vi.fn(),
}));

import { createSafeHandler } from "./api-wrapper";

describe("createSafeHandler", () => {
  beforeEach(() => {
    enforceSubjectRateLimitMock.mockReset();
    enforceSubjectRateLimitMock.mockResolvedValue(null);
    recordApiRequestMock.mockReset();
    logErrorMock.mockReset();
  });

  it("maps DomainError to HTTP response without fallback 500", async () => {
    const handler = createSafeHandler(async () => {
      throw new DomainError({
        status: 409,
        code: "PAYMENT_STATUS_REQUIRES_SETTLEMENT",
        message:
          "Liquidação deve ser feita via /api/gyms/payments/[paymentId]/settle",
        details: {
          paymentId: "payment_123",
          attemptedStatus: "paid",
        },
      });
    });

    const request = new NextRequest("https://example.com/api/test", {
      method: "POST",
      headers: new Headers({
        "content-type": "application/json",
      }),
      body: JSON.stringify({}),
    });

    const response = await handler(request);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toMatchObject({
      error:
        "Liquidação deve ser feita via /api/gyms/payments/[paymentId]/settle",
      message:
        "Liquidação deve ser feita via /api/gyms/payments/[paymentId]/settle",
      code: "PAYMENT_STATUS_REQUIRES_SETTLEMENT",
      details: {
        paymentId: "payment_123",
        attemptedStatus: "paid",
      },
    });
    expect(logErrorMock).toHaveBeenCalled();
  });

  it("keeps generic 500 for unexpected errors", async () => {
    const handler = createSafeHandler(async () => {
      throw new Error("boom");
    });

    const request = new NextRequest("https://example.com/api/test", {
      method: "GET",
    });

    const response = await handler(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: "Erro interno do servidor",
    });
  });
});
