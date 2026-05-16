import { describe, expect, it } from "vitest";
import { generateSessionToken } from "./session-token";

describe("generateSessionToken", () => {
  it("returns a base64url token with strong entropy", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(token).not.toContain(".");
    expect(token).not.toContain(":");
  });

  it("does not collide in a small batch", () => {
    const tokens = new Set<string>();
    for (let index = 0; index < 1000; index += 1) {
      tokens.add(generateSessionToken());
    }

    expect(tokens.size).toBe(1000);
  });
});
