import { expect, test } from "@playwright/test";

test("auth callback surfaces the extracted error state before redirecting away", async ({
  page,
}) => {
  await page.goto("/auth/callback?error=true&message=Falha%20E2E");

  const callbackScreen = page.getByTestId("auth-callback-screen");

  await expect(callbackScreen).toBeVisible();
  await expect(callbackScreen.getByText(/Erro ao fazer login/i)).toBeVisible();
  await expect(
    callbackScreen.getByText(/Erro durante autenticacao\. Tente novamente\./i),
  ).toBeVisible();
});
