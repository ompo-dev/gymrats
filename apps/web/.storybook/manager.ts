import { addons } from "storybook/manager-api";
import { gymratsStorybookTheme } from "./theme";

addons.setConfig({
  panelPosition: "right",
  sidebar: {
    showRoots: true,
  },
  theme: gymratsStorybookTheme,
});
