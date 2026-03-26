import { expect, test } from "@playwright/test";

test("legacy auth login route redirects to welcome", async ({ page }) => {
  await page.goto("/auth/login");

  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByTestId("welcome-screen")).toBeVisible();
});
