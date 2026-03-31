import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("admin observability resources reject anonymous requests", async ({
  request,
}) => {
  const scenarios = [
    "/api/admin/observability/summary",
    "/api/admin/observability/errors",
    "/api/admin/observability/routes",
    "/api/admin/observability/recent",
  ] as const;

  for (const path of scenarios) {
    const response = await request.get(`${apiBaseURL}${path}`);
    expect(response.status(), `${path} should reject anonymous access`).toBe(401);
  }
});
