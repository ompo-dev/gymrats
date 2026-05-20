import { describe, expect, it } from "vitest";
import { buildEnvironmentContext } from "./server";

describe("web access-control buildEnvironmentContext", () => {
  it("does not trust x-gym-context-plan and uses session subscription", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-gym-context-id": "gym-web-1",
        "x-gym-context-plan": "ENTERPRISE",
      },
    });

    const env = buildEnvironmentContext(request, {
      gyms: [
        {
          id: "gym-web-1",
          subscription: { plan: "BASIC", status: "active" },
        },
      ],
    });

    expect(env).toEqual({
      type: "GYM",
      id: "gym-web-1",
      plan: "BASIC",
      isSubscriptionActive: true,
    });
  });

  it("fails closed for personal context when session has no plan metadata", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-personal-context-id": "personal-1",
        "x-personal-context-plan": "PRO_AI",
      },
    });

    const env = buildEnvironmentContext(request, {
      personal: { id: "personal-1" },
    });

    expect(env).toBeUndefined();
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
