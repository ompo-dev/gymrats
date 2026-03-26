import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("anonymous requests are rejected across protected domain surfaces", async ({
  request,
}) => {
  const scenarios = [
    {
      label: "student profile",
      method: "GET",
      path: "/api/students/profile",
    },
    {
      label: "student personals",
      method: "GET",
      path: "/api/students/personals",
    },
    {
      label: "student nearby personals",
      method: "GET",
      path: "/api/students/personals/nearby?filter=all",
    },
    {
      label: "student pay now",
      method: "POST",
      path: "/api/students/payments/payment-e2e/pay-now",
    },
    {
      label: "student simulate pix",
      method: "POST",
      path: "/api/students/payments/payment-e2e/simulate-pix",
    },
    {
      label: "personal students",
      method: "GET",
      path: "/api/personals/students",
    },
    {
      label: "gym profile",
      method: "GET",
      path: "/api/gyms/profile",
    },
    {
      label: "gym students",
      method: "GET",
      path: "/api/gyms/students",
    },
    {
      label: "mobile push test",
      method: "POST",
      path: "/api/mobile/notifications/test",
      data: {},
    },
    {
      label: "student referrals",
      method: "GET",
      path: "/api/students/referrals",
    },
  ] as const;

  for (const scenario of scenarios) {
    const response =
      scenario.method === "POST"
        ? await request.post(`${apiBaseURL}${scenario.path}`, {
            data: scenario.data,
          })
        : await request.get(`${apiBaseURL}${scenario.path}`);

    expect(
      response.status(),
      `${scenario.label} should reject anonymous access`,
    ).toBe(401);

    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String),
    });
  }
});

test("observability rejects malformed payloads before persistence", async ({
  request,
}) => {
  const response = await request.post(`${apiBaseURL}/api/observability/events`, {
    data: {},
  });

  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: expect.any(String),
  });
});
