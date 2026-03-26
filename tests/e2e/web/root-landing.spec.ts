import { expect, test } from "@playwright/test";

test("guest root landing shows the marketing entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("navigation").getByText("GymRats")).toBeVisible();
  await expect(page.getByRole("link", { name: /Entrar/i })).toBeVisible();
  await expect(page.getByRole("navigation").locator("button").first()).toBeVisible();
});
