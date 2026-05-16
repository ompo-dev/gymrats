import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

const cronSecret = process.env.CRON_SECRET || "gymrats-e2e-cron-secret";

test("cron endpoint rejects missing authorization", async ({ request }) => {
  const response = await request.get(`${apiBaseURL}/api/cron/week-reset`);
  expect(response.status()).toBe(401);
});

test("cron endpoint accepts valid authorization header", async ({ request }) => {
  const response = await request.get(`${apiBaseURL}/api/cron/week-reset`, {
    headers: {
      authorization: `Bearer ${cronSecret}`,
    },
  });

  expect(response.status()).not.toBe(401);
});
