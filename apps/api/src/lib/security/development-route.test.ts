import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { auditLogMock } = vi.hoisted(() => ({
  auditLogMock: vi.fn(),
}));

vi.mock("./audit-log", () => ({
  auditLog: auditLogMock,
}));

import { blockProductionDevelopmentRoute } from "./development-route";

describe("blockProductionDevelopmentRoute", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    auditLogMock.mockReset();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("returns null outside production", async () => {
    process.env.NODE_ENV = "development";

    const result = await blockProductionDevelopmentRoute({
      request: {
        headers: new Headers(),
        nextUrl: new URL("https://example.com/api/test"),
      },
      actorId: "user_123",
    });

    expect(result).toBeNull();
    expect(auditLogMock).not.toHaveBeenCalled();
  });

  it("returns 404 and audits in production", async () => {
    process.env.NODE_ENV = "production";

    const response = await blockProductionDevelopmentRoute({
      request: {
        headers: new Headers([["user-agent", "vitest"]]),
        nextUrl: new URL("https://example.com/api/test"),
      },
      actorId: "user_123",
      targetId: "payment_123",
    });

    expect(response).not.toBeNull();
    expect(response?.status).toBe(404);
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "SECURITY:FORBIDDEN",
        actorId: "user_123",
        targetId: "payment_123",
        result: "FAILURE",
        payload: expect.objectContaining({
          route: "/api/test",
          reason: "development_only_route",
        }),
      }),
    );
  });
});
