import { describe, expect, it } from "vitest";
import { buildIdempotencyFingerprint } from "./idempotency-store";

describe("buildIdempotencyFingerprint", () => {
  it("keeps the same fingerprint for semantically identical payloads", () => {
    const first = buildIdempotencyFingerprint({
      route: "/api/gyms/withdraws",
      method: "POST",
      actorId: "user-1",
      body: {
        amountCents: 1000,
        nested: {
          two: 2,
          one: 1,
        },
      },
    });

    const second = buildIdempotencyFingerprint({
      route: "/api/gyms/withdraws",
      method: "POST",
      actorId: "user-1",
      body: {
        nested: {
          one: 1,
          two: 2,
        },
        amountCents: 1000,
      },
    });

    expect(first).toBe(second);
  });

  it("changes when actor changes", () => {
    const first = buildIdempotencyFingerprint({
      route: "/api/gyms/withdraws",
      method: "POST",
      actorId: "user-1",
      body: { amountCents: 1000 },
    });

    const second = buildIdempotencyFingerprint({
      route: "/api/gyms/withdraws",
      method: "POST",
      actorId: "user-2",
      body: { amountCents: 1000 },
    });

    expect(first).not.toBe(second);
  });
});
