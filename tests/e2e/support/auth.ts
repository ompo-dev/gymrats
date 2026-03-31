export type E2ERole = "STUDENT" | "GYM" | "PERSONAL" | "ADMIN";

export interface MockSessionPayload {
  user: {
    id: string;
    email: string;
    name: string;
    role: E2ERole;
    hasGym: boolean;
    hasStudent: boolean;
    activeGymId?: string | null;
    gyms?: Array<{
      id: string;
      plan?: string;
      subscription?: {
        plan: string;
        status: string;
        currentPeriodEnd?: string | null;
      } | null;
    }>;
  };
  session: {
    id: string;
    token: string;
  };
}

export function createMockSessionPayload(role: E2ERole): MockSessionPayload {
  const baseUser = {
    id: `${role.toLowerCase()}-e2e-user`,
    email: `${role.toLowerCase()}@gymrats.local`,
    name: `E2E ${role}`,
    role,
    hasGym: role === "GYM" || role === "ADMIN",
    hasStudent: role === "STUDENT",
  } as const;

  if (role === "GYM" || role === "ADMIN") {
    return {
      user: {
        ...baseUser,
        activeGymId: "gym-e2e-1",
        gyms: [
          {
            id: "gym-e2e-1",
            plan: "premium",
            subscription: {
              plan: "premium",
              status: "active",
              currentPeriodEnd: "2026-04-20T00:00:00.000Z",
            },
          },
        ],
      },
      session: {
        id: `session-${role.toLowerCase()}-e2e`,
        token: `token-${role.toLowerCase()}-e2e`,
      },
    };
  }

  return {
    user: baseUser,
    session: {
      id: `session-${role.toLowerCase()}-e2e`,
      token: `token-${role.toLowerCase()}-e2e`,
    },
  };
}

export function createBootstrapMeta(strategy: string) {
  return {
    version: "e2e",
    generatedAt: new Date().toISOString(),
    requestId: `req-${strategy}`,
    sectionTimings: {},
    cache: {
      hit: false,
      strategy,
      ttlMs: 0,
    },
  };
}
