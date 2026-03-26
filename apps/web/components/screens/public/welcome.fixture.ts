import type { WelcomeScreenProps } from "./welcome.screen";

export function createWelcomeFixture(
  overrides: Partial<WelcomeScreenProps> = {},
): WelcomeScreenProps {
  return {
    error: "",
    isLoading: false,
    onGoogleLogin: () => {},
    ...overrides,
  };
}
