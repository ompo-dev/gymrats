import type { AuthCallbackScreenProps } from "./auth-callback.screen";

export function createAuthCallbackFixture(
  overrides: Partial<AuthCallbackScreenProps> = {},
): AuthCallbackScreenProps {
  return {
    status: "processing",
    error: "",
    ...overrides,
  };
}
