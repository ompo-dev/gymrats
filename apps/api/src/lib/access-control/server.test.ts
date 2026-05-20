import { describe, expect, it } from "vitest";
import { buildEnvironmentContext } from "./server";

describe("api access-control buildEnvironmentContext", () => {
  it("ignores x-gym-context-plan and resolves plan/status from session", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-gym-context-id": "gym-1",
        "x-gym-context-plan": "ENTERPRISE",
      },
    });

    const env = buildEnvironmentContext(request, {
      gyms: [
        {
          id: "gym-1",
          plan: "BASIC",
          subscription: {
            plan: "PREMIUM",
            status: "canceled",
          },
        },
      ],
    });

    expect(env).toEqual({
      type: "GYM",
      id: "gym-1",
      plan: "PREMIUM",
      isSubscriptionActive: false,
    });
  });

  it("fails closed when provided gym context is outside the session scope", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-gym-context-id": "gym-attacker",
        "x-gym-context-plan": "ENTERPRISE",
      },
    });

    const env = buildEnvironmentContext(request, {
      gyms: [{ id: "gym-owned", plan: "PREMIUM" }],
    });

    expect(env).toBeUndefined();
  });

  it("uses activeGymId fallback from session when request does not provide context id", () => {
    const request = new Request("http://localhost");
    const env = buildEnvironmentContext(request, {
      activeGymId: "gym-2",
      gyms: [
        {
          id: "gym-2",
          subscription: { plan: "ENTERPRISE", status: "active" },
        },
      ],
    });

    expect(env).toEqual({
      type: "GYM",
      id: "gym-2",
      plan: "ENTERPRISE",
      isSubscriptionActive: true,
    });
  });

  it("resolves personal plan/status from session and ignores header plan", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-personal-context-id": "personal-1",
        "x-personal-context-plan": "PRO_AI",
      },
    });

    const env = buildEnvironmentContext(request, {
      personal: {
        id: "personal-1",
        subscription: {
          plan: "STANDARD",
          status: "active",
        },
      },
    });

    expect(env).toEqual({
      type: "PERSONAL",
      id: "personal-1",
      plan: "STANDARD",
      isSubscriptionActive: true,
    });
  });
});
