import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("gym and personal directory resources reject anonymous requests", async ({
  request,
}) => {
  const scenarios = [
    { label: "gym profile", path: "/api/gyms/profile" },
    { label: "gym students", path: "/api/gyms/students" },
    { label: "gym subscriptions", path: "/api/gym-subscriptions/current" },
    { label: "personal students", path: "/api/personals/students" },
    { label: "personal bootstrap", path: "/api/personals/bootstrap" },
    { label: "gym bootstrap", path: "/api/gyms/bootstrap" },
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

test("gym-personal linking routes reject anonymous writes", async ({
  request,
}) => {
  const scenarios = [
    {
      label: "list linked personals",
      method: "GET",
      path: "/api/gym/personals",
    },
    {
      label: "search personals",
      method: "GET",
      path: "/api/gym/personals/search?query=rafa",
    },
    {
      label: "personal profile from gym",
      method: "GET",
      path: "/api/gym/personals/personal-profile-1/profile",
    },
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
