import { expect, test } from "@playwright/test";

const apiBaseURL =
  process.env.PLAYWRIGHT_API_BASE_URL || "http://127.0.0.1:3001";

test("student discovery resources reject anonymous requests", async ({
  request,
}) => {
  const scenarios = [
    "/api/students/gyms/gym-profile-1/profile",
    "/api/students/personals",
    "/api/students/personals/nearby",
    "/api/students/personals/personal-profile-1/profile",
    "/api/students/profile",
    "/api/students/student",
  ] as const;

  for (const path of scenarios) {
    const response = await request.get(`${apiBaseURL}${path}`);
    expect(response.status(), `${path} should reject anonymous access`).toBe(401);
  }
});
