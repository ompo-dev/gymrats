import { expect, test } from "@playwright/test";

test("swagger route renders the extracted docs screen", async ({ page }) => {
  await page.route("**/api/swagger", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        info: {
          title: "GymRats API",
          version: "1.0.0",
          description: "Contrato publico",
        },
        servers: [{ url: "http://127.0.0.1:3001" }],
        tags: [
          {
            name: "auth",
            description: "Fluxos de autenticacao",
          },
        ],
        paths: {
          "/api/auth/session": {
            get: {
              summary: "Current session",
              description: "Retorna a sessao atual",
              tags: ["auth"],
            },
          },
        },
      }),
    });
  });

  await page.goto("/swagger");

  await expect(page.getByTestId("swagger-docs-screen")).toBeVisible();
  await expect(page.getByText(/GymRats API/i)).toBeVisible();
  await expect(page.getByTestId("swagger-docs-screen.tag")).toHaveCount(1);
  await expect(page.getByTestId("swagger-docs-screen.operation")).toHaveCount(1);
});
