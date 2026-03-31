import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("abacatepay webhook rejects requests without signature", async ({
  request,
}) => {
  const response = await request.post(`${apiBaseURL}/api/webhooks/abacatepay`, {
    data: {
      event: "billing.paid",
      data: {
        id: "billing-e2e-1",
      },
    },
  });

  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Missing webhook signature",
  });
});

test("abacatepay webhook rejects invalid signatures", async ({ request }) => {
  const response = await request.post(`${apiBaseURL}/api/webhooks/abacatepay`, {
    data: {
      event: "billing.paid",
      data: {
        id: "billing-e2e-2",
      },
    },
    headers: {
      "x-webhook-signature": "invalid-signature",
    },
  });

  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    error: "Invalid cryptographic signature",
  });
});
