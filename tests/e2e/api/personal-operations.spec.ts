import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("personal business resources reject anonymous requests", async ({
  request,
}) => {
  const scenarios = [
    "/api/personals/financial-summary",
    "/api/personals/payments",
    "/api/personals/gyms",
    "/api/personals/affiliations",
    "/api/personals/membership-plans",
    "/api/personals/subscription",
  ] as const;

  for (const path of scenarios) {
    const response = await request.get(`${apiBaseURL}${path}`);
    expect(response.status(), `${path} should reject anonymous access`).toBe(401);
  }
});
