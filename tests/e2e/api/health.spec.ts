import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("health endpoints respond", async ({ request }) => {
  const [health, healthz] = await Promise.all([
    request.get(`${apiBaseURL}/health`),
    request.get(`${apiBaseURL}/healthz`),
  ]);

  expect(health.ok()).toBeTruthy();
  expect(healthz.ok()).toBeTruthy();
  await expect(health.json()).resolves.toMatchObject({ status: "ok" });
  await expect(healthz.json()).resolves.toMatchObject({ status: "ok" });
});

test("protected bootstrap endpoints reject anonymous requests", async ({
  request,
}) => {
  const [studentsBootstrap, personalsBootstrap, gymsBootstrap] =
    await Promise.all([
      request.get(`${apiBaseURL}/api/students/bootstrap`),
      request.get(`${apiBaseURL}/api/personals/bootstrap`),
      request.get(`${apiBaseURL}/api/gyms/bootstrap`),
    ]);

  expect(studentsBootstrap.status()).toBe(401);
  expect(personalsBootstrap.status()).toBe(401);
  expect(gymsBootstrap.status()).toBe(401);
});

test("auth session contract exposes anonymous failure cleanly", async ({
  request,
}) => {
  const response = await request.get(`${apiBaseURL}/api/auth/session`);

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    error: expect.any(String),
  });
});

test("cron week reset requires the configured secret", async ({ request }) => {
  const response = await request.get(`${apiBaseURL}/api/cron/week-reset`);

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    error: "Unauthorized",
  });
});

test("swagger contract is publicly available", async ({ request }) => {
  const response = await request.get(`${apiBaseURL}/api/swagger`);

  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    openapi: expect.any(String),
    paths: expect.any(Object),
  });
});

test("mobile installation registration rejects anonymous requests", async ({
  request,
}) => {
  const response = await request.post(
    `${apiBaseURL}/api/mobile/installations/register`,
    {
      data: {
        installationId: "install-e2e-1",
        platform: "android",
        pushPermission: "granted",
        active: true,
      },
    },
  );

  expect(response.status()).toBe(401);
  await expect(response.json()).resolves.toMatchObject({
    error: expect.any(String),
  });
});
