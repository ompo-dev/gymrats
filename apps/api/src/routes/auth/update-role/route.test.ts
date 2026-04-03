import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  auditLogMock,
  updateRoleUseCaseMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  auditLogMock: vi.fn(),
  updateRoleUseCaseMock: vi.fn(),
}));

vi.mock("@/lib/api/middleware/auth.middleware", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/security/audit-log", () => ({
  auditLog: auditLogMock,
}));

vi.mock("@/lib/observability", () => ({
  log: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/use-cases/auth", () => ({
  updateRoleUseCase: updateRoleUseCaseMock,
}));

import { POST } from "./route";

describe("POST /api/auth/update-role", () => {
  const adminId = "ckadmin1234567890abcdef123";
  const targetUserId = "cktarget1234567890abcdef12";

  beforeEach(() => {
    requireAdminMock.mockReset();
    auditLogMock.mockReset();
    updateRoleUseCaseMock.mockReset();
  });

  it("blocks public ADMIN escalation attempts", async () => {
    requireAdminMock.mockResolvedValue({
      userId: adminId,
      session: { id: "session_123" },
      user: { id: adminId, role: "ADMIN" },
    });

    const response = await POST({
      json: async () => ({ userId: targetUserId, role: "ADMIN" }),
      nextUrl: new URL("https://example.com/api/auth/update-role"),
      headers: new Headers(),
    } as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Promocao publica para ADMIN nao e permitida",
    });
    expect(updateRoleUseCaseMock).not.toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ROLE:ESCALATION_ATTEMPT",
        actorId: adminId,
        targetId: targetUserId,
        result: "FAILURE",
      }),
    );
  });

  it("updates allowed roles and audits success", async () => {
    requireAdminMock.mockResolvedValue({
      userId: adminId,
      session: { id: "session_123" },
      user: { id: adminId, role: "ADMIN" },
    });
    updateRoleUseCaseMock.mockResolvedValue({
      ok: true,
      data: {
        user: {
          id: targetUserId,
          role: "STUDENT",
        },
      },
    });

    const response = await POST({
      json: async () => ({
        userId: targetUserId,
        role: "STUDENT",
        userType: "student",
      }),
      nextUrl: new URL("https://example.com/api/auth/update-role"),
      headers: new Headers(),
    } as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: targetUserId,
        role: "STUDENT",
      },
    });
    expect(updateRoleUseCaseMock).toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ROLE:CHANGED",
        actorId: adminId,
        targetId: targetUserId,
        result: "SUCCESS",
      }),
    );
  });
});
