import { expect, test } from "@playwright/test";

test("welcome route renders the extracted public screen", async ({ page }) => {
  await page.goto("/welcome");

  await expect(page.getByTestId("welcome-screen")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Entrar com Google/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Termos de Uso/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Politica de Privacidade/i }),
  ).toBeVisible();
});
