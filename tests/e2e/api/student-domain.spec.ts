import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("student wellness and workout resources reject anonymous requests", async ({
  request,
}) => {
  const scenarios = [
    { label: "student progress", path: "/api/students/progress" },
    { label: "student personal records", path: "/api/students/personal-records" },
    { label: "student friends", path: "/api/students/friends" },
    { label: "workout history", path: "/api/workouts/history" },
    { label: "weekly plan", path: "/api/workouts/weekly-plan" },
    { label: "daily nutrition", path: "/api/nutrition/daily" },
  ] as const;

  for (const scenario of scenarios) {
    const response = await request.get(`${apiBaseURL}${scenario.path}`);

    expect(
      response.status(),
      `${scenario.label} should reject anonymous access`,
    ).toBe(401);

    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
    });
  }
});

test("student billing resources reject anonymous requests", async ({
  request,
}) => {
  const scenarios = [
    { label: "current subscription", path: "/api/subscriptions/current" },
    { label: "payment methods", path: "/api/payment-methods" },
    { label: "payments", path: "/api/payments" },
    { label: "memberships", path: "/api/memberships" },
    { label: "student referrals", path: "/api/students/referrals" },
    { label: "student day-passes", path: "/api/students/day-passes" },
  ] as const;

  for (const scenario of scenarios) {
    const response = await request.get(`${apiBaseURL}${scenario.path}`);

    expect(
      response.status(),
      `${scenario.label} should reject anonymous access`,
    ).toBe(401);

    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
    });
  }
});
