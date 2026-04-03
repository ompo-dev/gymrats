import { describe, expect, it, vi } from "vitest";
import type { UserSummary } from "./types";
import {
  getSessionUseCase,
  signInUseCase,
  updateRoleUseCase,
} from "./use-cases";

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

  it("creates a personal record when updating a user to PERSONAL", async () => {
    const createPersonal = vi.fn().mockResolvedValue(undefined);

    const result = await updateRoleUseCase(
      {
        findUserById: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "personal@gymrats.app",
          name: "Coach",
          role: "PENDING",
          gyms: [],
          student: null,
          personal: null,
        }),
        updateUserRole: vi.fn().mockResolvedValue({
          id: "user-1",
          email: "personal@gymrats.app",
          name: "Coach",
          role: "PERSONAL",
        }),
        findStudentByUserId: vi.fn().mockResolvedValue(null),
        createStudent: vi.fn().mockResolvedValue(undefined),
        findGymByUserId: vi.fn().mockResolvedValue(null),
        findPersonalByUserId: vi.fn().mockResolvedValue(null),
        createGym: vi.fn().mockResolvedValue(undefined),
        createPersonal,
      },
      {
        userId: "user-1",
        role: "PERSONAL",
      },
    );

    expect(result.ok).toBe(true);
    expect(createPersonal).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Coach",
      email: "personal@gymrats.app",
    });
  });
});
