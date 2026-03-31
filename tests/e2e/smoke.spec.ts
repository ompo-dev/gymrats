import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});

test("login page renders", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.locator("body")).toContainText(/login|entrar/i);
});

test("student login flow", async ({ page }) => {
  test.skip(
    !process.env.E2E_STUDENT_EMAIL || !process.env.E2E_STUDENT_PASSWORD,
    "Configure E2E_STUDENT_EMAIL e E2E_STUDENT_PASSWORD para validar a jornada autenticada.",
  );

  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(process.env.E2E_STUDENT_EMAIL ?? "");
  await page
    .getByLabel(/senha|password/i)
    .fill(process.env.E2E_STUDENT_PASSWORD ?? "");
  await page.getByRole("button", { name: /entrar|login/i }).click();
  await page.waitForURL(/\/student/);
  await expect(page).toHaveURL(/\/student/);
});
