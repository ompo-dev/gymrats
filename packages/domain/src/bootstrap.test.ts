import { describe, expect, it } from "vitest";
import { createBootstrapResponse, measureBootstrapSection } from "./bootstrap";
import { runWithRequestContext } from "./request-runtime";

describe("bootstrap helpers", () => {
  it("creates a bootstrap response with request metadata", () => {
    const response = runWithRequestContext(
      {
        headers: new Headers({ cookie: "auth_token=test" }),
        requestId: "req-bootstrap-1",
      },
      () =>
        createBootstrapResponse({
          data: { ok: true },
          sectionTimings: { profile: 12 },
        }),
    );

    expect(response.data).toEqual({ ok: true });
    expect(response.meta.requestId).toBe("req-bootstrap-1");
    expect(response.meta.sectionTimings.profile).toBe(12);
    expect(response.meta.cache.hit).toBe(false);
  });

  it("records timing for each bootstrap section", async () => {
    const timings = {} as Record<string, number>;
    const result = await measureBootstrapSection(
      "payments",
      timings,
      async () => {
        await Promise.resolve();
        return { count: 1 };
      },
    );

    expect(result).toEqual({ count: 1 });
    expect(timings.payments).toBeGreaterThanOrEqual(0);
  });
});
