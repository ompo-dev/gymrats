import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("gym operational resources reject anonymous requests", async ({
  request,
}) => {
  const scenarios = [
    "/api/gyms/plans",
    "/api/gyms/equipment",
    "/api/gyms/checkins/recent",
    "/api/gyms/members",
    "/api/gyms/stats",
  ] as const;

  for (const path of scenarios) {
    const response = await request.get(`${apiBaseURL}${path}`);
    expect(response.status(), `${path} should reject anonymous access`).toBe(401);
  }
});
