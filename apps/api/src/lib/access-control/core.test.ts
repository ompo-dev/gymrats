import { describe, expect, it } from "vitest";
import { checkAbility } from "./core";
import { Features } from "./features";

describe("access-control checkAbility inheritance hardening", () => {
  it("fails closed when inherited environment subscription is inactive", () => {
    const allowed = checkAbility(
      {
        id: "user-1",
        role: "STUDENT",
        activePlan: "FREE",
        isSubscriptionActive: true,
      },
      Features.USE_AI_WORKOUT,
      {
        type: "GYM",
        id: "gym-1",
        plan: "ENTERPRISE",
        isSubscriptionActive: false,
      },
    );

    expect(allowed).toBe(false);
  });

  it("allows inherited feature only when environment subscription is active", () => {
    const allowed = checkAbility(
      {
        id: "user-2",
        role: "STUDENT",
        activePlan: "FREE",
        isSubscriptionActive: true,
      },
      Features.USE_AI_WORKOUT,
      {
        type: "GYM",
        id: "gym-2",
        plan: "ENTERPRISE",
        isSubscriptionActive: true,
      },
    );

    expect(allowed).toBe(true);
  });
});
