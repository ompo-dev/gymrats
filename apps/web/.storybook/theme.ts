import { create } from "storybook/theming/create";

export const gymratsStorybookTheme = create({
  base: "light",
  brandTitle: "GymRats UI System",
  brandUrl: "https://gymrats.app",
  fontBase:
    '"Nunito", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  colorPrimary: "#58cc02",
  colorSecondary: "#1cb0f6",
  appBg: "#f5f7f6",
  appContentBg: "#ffffff",
  appBorderColor: "#d1d9d6",
  appBorderRadius: 16,
  textColor: "#131f24",
  textInverseColor: "#ffffff",
  barTextColor: "#5a6b63",
  barSelectedColor: "#131f24",
  barBg: "#ffffff",
  inputBg: "#ffffff",
  inputBorder: "#d1d9d6",
  inputTextColor: "#131f24",
  inputBorderRadius: 12,
});
