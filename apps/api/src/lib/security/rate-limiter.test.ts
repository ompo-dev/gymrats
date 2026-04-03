import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auditLogMock,
  execMock,
  connectMock,
  redisConnectionMock,
} = vi.hoisted(() => {
  const execMock = vi.fn();
  const connectMock = vi.fn();
  const multiMock = vi.fn(() => ({
    zremrangebyscore: vi.fn(),
    zadd: vi.fn(),
    zcard: vi.fn(),
    expire: vi.fn(),
    exec: execMock,
  }));

  return {
    auditLogMock: vi.fn(),
    execMock,
    connectMock,
    redisConnectionMock: {
      status: "ready",
      connect: connectMock,
      multi: multiMock,
    },
  };
});

vi.mock("@gymrats/cache", () => ({
  redisConnection: redisConnectionMock,
}));

vi.mock("@/lib/observability", () => ({
  log: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("./audit-log", () => ({
  auditLog: auditLogMock,
}));

import { enforceIpRateLimit, enforceSubjectRateLimit } from "./rate-limiter";

describe("rate-limiter", () => {
  beforeEach(() => {
    execMock.mockReset();
    connectMock.mockReset();
    auditLogMock.mockReset();
    redisConnectionMock.status = "ready";
  });

  it("allows requests under the IP threshold", async () => {
    execMock.mockResolvedValue([[null, 0], [null, 1], [null, 1], [null, 1]]);

    const response = await enforceIpRateLimit(
      new Request("https://example.com/api/auth/sign-in", {
        headers: new Headers([["x-forwarded-for", "203.0.113.10"]]),
      }),
    );

    expect(response).toBeNull();
    expect(auditLogMock).not.toHaveBeenCalled();
  });

  it("returns 429 with headers when IP limit is exceeded", async () => {
    execMock.mockResolvedValue([[null, 0], [null, 1], [null, 6], [null, 1]]);

    const response = await enforceIpRateLimit(
      new Request("https://example.com/api/auth/sign-in", {
        headers: new Headers([["x-forwarded-for", "203.0.113.11"]]),
      }),
    );

    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "SECURITY:RATE_LIMITED",
        result: "FAILURE",
        payload: expect.objectContaining({
          policy: "auth:sign-in",
          path: "/api/auth/sign-in",
        }),
      }),
    );
  });

  it("rate limits subject-scoped payment routes", async () => {
    execMock.mockResolvedValue([[null, 0], [null, 1], [null, 6], [null, 1]]);

    const response = await enforceSubjectRateLimit({
      request: new Request("https://example.com/api/payments"),
      subjectKey: "user_123",
      actorId: "user_123",
    });

    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "SECURITY:RATE_LIMITED",
        actorId: "user_123",
        payload: expect.objectContaining({
          policy: "api:payments",
          path: "/api/payments",
        }),
      }),
    );
  });
});
