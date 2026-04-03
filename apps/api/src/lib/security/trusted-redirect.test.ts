import { describe, expect, it } from "vitest";
import { resolveSafeRedirectTarget } from "./trusted-redirect";

describe("resolveSafeRedirectTarget", () => {
  const baseInput = {
    appUrl: "https://app.gymrats.test",
    requestOrigin: "https://preview.gymrats.test",
  };

  it("allows same-origin redirects", () => {
    const result = resolveSafeRedirectTarget({
      ...baseInput,
      candidate: "https://app.gymrats.test/auth/callback?next=%2Fstudent",
      fallback: "/auth/callback",
    });

    expect(result).toBe(
      "https://app.gymrats.test/auth/callback?next=%2Fstudent",
    );
  });

  it("falls back when redirect points to an untrusted origin", () => {
    const result = resolveSafeRedirectTarget({
      ...baseInput,
      candidate: "https://evil.example/capture",
      fallback: "/auth/callback",
    });

    expect(result).toBe("https://app.gymrats.test/auth/callback");
  });

  it("allows explicitly trusted origins from env-style input", () => {
    const result = resolveSafeRedirectTarget({
      ...baseInput,
      candidate: "https://beta.gymrats.test/auth/callback",
      fallback: "/auth/callback",
      trustedOrigins: "https://beta.gymrats.test, https://staging.gymrats.test",
    });

    expect(result).toBe("https://beta.gymrats.test/auth/callback");
  });

  it("falls back for non-http schemes", () => {
    const result = resolveSafeRedirectTarget({
      ...baseInput,
      candidate: "javascript:alert(1)",
      fallback: "/auth/callback?error=true",
    });

    expect(result).toBe("https://app.gymrats.test/auth/callback?error=true");
  });
});
