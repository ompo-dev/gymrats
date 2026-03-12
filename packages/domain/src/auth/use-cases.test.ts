import { describe, expect, it, vi } from "vitest";
import type { SessionWithUser, UserSummary } from "./types";
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

  it("prefers the token that actually belongs to the authenticated user", async () => {
    const wrongSession: SessionWithUser = {
      id: "session-wrong",
      userId: "other-user",
      token: "wrong-token",
      user: {
        id: "other-user",
        email: "other@gymrats.app",
        name: "Other",
        role: "STUDENT",
      },
    };

    const rightSession: SessionWithUser = {
      id: "session-right",
      userId: "user-1",
      token: "right-token",
      user: {
        id: "user-1",
        email: "student@gymrats.app",
        name: "Student",
        role: "STUDENT",
      },
    };

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
        getSessionByToken: vi.fn(
          async (token: string): Promise<SessionWithUser | null> => {
            if (token === "wrong-token") {
              return wrongSession;
            }

            if (token === "right-token") {
              return rightSession;
            }

            return null;
          },
        ),
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
      expect(result.data.shouldSyncAuthToken).toBe(true);
    }
  });
});
