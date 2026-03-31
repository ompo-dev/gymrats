import type { LoginRedirectScreenProps } from "./login-redirect.screen";

export function createLoginRedirectFixture(
  overrides: Partial<LoginRedirectScreenProps> = {},
): LoginRedirectScreenProps {
  return {
    message: "Redirecionando...",
    ...overrides,
  };
}
