import { describe, expect, it, vi } from "vitest";
import type { GetSessionDeps } from "@/lib/use-cases/auth/use-cases";
import { getAuthSessionFromRequestHeaders } from "./middleware-auth";

function createDeps(): GetSessionDeps {
  return {
    getBetterAuthSession: vi.fn().mockResolvedValue(null),
    findUserById: vi.fn().mockResolvedValue(null),
    getSessionTokenById: vi.fn().mockResolvedValue(null),
    getSessionByToken: vi.fn().mockResolvedValue(null),
  };
}

describe("getAuthSessionFromRequestHeaders", () => {
  it("returns the legacy session when auth_token resolves directly", async () => {
    const deps = createDeps();
    vi.mocked(deps.getSessionByToken).mockResolvedValue({
      id: "session-1",
      token: "legacy-token",
      sessionToken: "legacy-token",
      user: {
        id: "user-1",
        email: "legacy@example.com",
        name: "Legacy User",
        role: "STUDENT",
        gyms: [],
        student: null,
        personal: null,
        activeGymId: null,
      },
    } as Awaited<ReturnType<GetSessionDeps["getSessionByToken"]>>);

    const result = await getAuthSessionFromRequestHeaders(
      new Headers({ cookie: "auth_token=legacy-token" }),
      deps,
    );

    expect(result?.user.id).toBe("user-1");
    expect(result?.session.token).toBe("legacy-token");
    expect(deps.getBetterAuthSession).not.toHaveBeenCalled();
  });

  it("falls back to the Better Auth session when the legacy lookup misses", async () => {
    const deps = createDeps();
    vi.mocked(deps.getBetterAuthSession).mockResolvedValue({
      user: { id: "user-2" },
      session: { id: "ba-session-1" },
    } as Awaited<ReturnType<GetSessionDeps["getBetterAuthSession"]>>);
    vi.mocked(deps.findUserById).mockResolvedValue({
      id: "user-2",
      email: "social@example.com",
      name: "Social User",
      role: "STUDENT",
      gyms: [],
      student: null,
      personal: null,
      activeGymId: null,
    });
    vi.mocked(deps.getSessionTokenById).mockResolvedValue("legacy-from-ba");

    const result = await getAuthSessionFromRequestHeaders(
      new Headers({ cookie: "better-auth.session_token=ba-token" }),
      deps,
    );

    expect(result?.user.id).toBe("user-2");
    expect(result?.session.id).toBe("ba-session-1");
    expect(result?.session.token).toBe("ba-token");
    expect(deps.getBetterAuthSession).toHaveBeenCalledTimes(1);
  });
});
