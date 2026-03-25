import { describe, expect, it } from "vitest";
import {
  type AuthContextDeps,
  type AuthContextPolicy,
  type AuthSession,
  resolveGymContext,
  resolvePersonalContext,
  resolveStudentContext,
} from "./auth-context";

const webPolicy: AuthContextPolicy = {
  gymLookupWhenMissing: "always",
  studentLookupWhenMissing: "always",
  personalLookupWhenMissing: "always",
  personalMissingStatus: 403,
  personalMissingMessage: "Perfil de personal nao encontrado",
};

const apiPolicy: AuthContextPolicy = {
  gymLookupWhenMissing: "admin-only",
  studentLookupWhenMissing: "admin-only",
  personalLookupWhenMissing: "always",
  personalMissingStatus: 500,
  personalMissingMessage: "Personal ID nao encontrado",
};

function createAuthSession(
  overrides?: Partial<AuthSession["user"]>,
): AuthSession {
  return {
    session: { token: "token" },
    user: {
      id: "user-1",
      role: "STUDENT",
      ...overrides,
    },
  };
}

const emptyDeps: AuthContextDeps = {
  async findGymIdByUserId() {
    return null;
  },
  async findPersonalIdByUserId() {
    return null;
  },
  async findStudentByUserId() {
    return null;
  },
};

describe("auth-context", () => {
  it("allows web gym fallback for non-admin users", async () => {
    const auth = createAuthSession({ role: "GYM" });

    const result = await resolveGymContext(auth, webPolicy, {
      ...emptyDeps,
      async findGymIdByUserId() {
        return "gym-1";
      },
    });

    expect(result).toEqual({
      ok: true,
      ctx: {
        gymId: "gym-1",
        session: auth.session,
        user: auth.user,
      },
    });
  });

  it("keeps api gym fallback restricted to admins", async () => {
    const auth = createAuthSession({ role: "GYM" });

    const result = await resolveGymContext(auth, apiPolicy, {
      ...emptyDeps,
      async findGymIdByUserId() {
        return "gym-1";
      },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        message: "Academia nao encontrada",
        status: 403,
      },
    });
  });

  it("uses policy-specific personal missing errors", async () => {
    const auth = createAuthSession({ role: "PERSONAL" });

    const result = await resolvePersonalContext(auth, apiPolicy, emptyDeps);

    expect(result).toEqual({
      ok: false,
      error: {
        message: "Personal ID nao encontrado",
        status: 500,
      },
    });
  });

  it("allows api student fallback only for admins", async () => {
    const auth = createAuthSession({ role: "ADMIN" });

    const result = await resolveStudentContext(auth, apiPolicy, {
      ...emptyDeps,
      async findStudentByUserId() {
        return { id: "student-1" };
      },
    });

    expect(result).toEqual({
      ok: true,
      ctx: {
        studentId: "student-1",
        session: auth.session,
        user: auth.user,
        student: { id: "student-1" },
      },
    });
  });
});
