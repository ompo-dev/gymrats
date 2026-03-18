import { describe, expect, it, vi } from "vitest";
import type { UserSummary } from "./types";
import { getSessionUseCase, signInUseCase } from "./use-cases";

describe("auth use cases", () => {
  it("returns unauthorized when password is invalid", async () => {
    const studentUser: UserSummary = {
      id: "user-1",
      email: "student@gymrats.app",
      name: "Student",
      role: "STUDENT",
      password: "hashed",
    };

    const result = await signInUseCase(
      {
        findUserByEmail: vi.fn().mockResolvedValue(studentUser),
        comparePassword: vi.fn().mockResolvedValue(false),
        createSession: vi.fn(),
      },
      {
        email: "student@gymrats.app",
        password: "wrong-password",
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(401);
      expect(result.error.message).toMatch(/senha/i);
    }
  });

  it("prefers the legacy auth token before falling back to better auth", async () => {
    const getSessionByToken = vi.fn().mockResolvedValue(null);
    const result = await getSessionUseCase(
      {
        getBetterAuthSession: vi.fn().mockResolvedValue({
          user: { id: "user-1" },
          session: { id: "session-1" },
        }),
        findUserById: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "student@gymrats.app",
          name: "Student",
          role: "STUDENT",
          student: { id: "student-1" },
          gyms: [],
        }),
        getSessionTokenById: vi.fn().mockResolvedValue("session-token"),
        getSessionByToken,
      },
      {
        headers: new Headers(),
        authHeaderToken: "wrong-token",
        cookieAuthToken: "right-token",
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sessionToken).toBe("right-token");
      expect(result.data.shouldSyncAuthToken).toBe(false);
    }
    expect(getSessionByToken).toHaveBeenCalledWith("right-token");
  });

  it("falls back to the better auth session id token when auth_token is missing", async () => {
    const getSessionTokenById = vi.fn().mockResolvedValue("session-token");

    const result = await getSessionUseCase(
      {
        getBetterAuthSession: vi.fn().mockResolvedValue({
          user: { id: "user-1" },
          session: { id: "session-1" },
        }),
        findUserById: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "student@gymrats.app",
          name: "Student",
          role: "STUDENT",
          student: { id: "student-1" },
          gyms: [],
        }),
        getSessionTokenById,
        getSessionByToken: vi.fn().mockResolvedValue(null),
      },
      {
        headers: new Headers(),
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sessionToken).toBe("session-token");
      expect(result.data.shouldSyncAuthToken).toBe(true);
    }
    expect(getSessionTokenById).toHaveBeenCalledWith("session-1");
  });
});
