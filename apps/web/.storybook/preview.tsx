import type { Preview } from "@storybook/react";
import { StorybookAppProviders } from "../components/storybook/storybook-app-providers";
import "../app/globals.css";
import { gymratsStorybookTheme } from "./theme";

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <StorybookAppProviders searchParams={context.parameters.nuqs?.searchParams}>
        <div className="min-h-screen bg-[var(--duo-bg)] px-6 py-8">
          <Story />
        </div>
      </StorybookAppProviders>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "canvas",
      values: [
        { name: "canvas", value: "#f5f7f6" },
        { name: "night", value: "#1a1f22" },
      ],
    },
    docs: {
      theme: gymratsStorybookTheme,
    },
    options: {
      storySort: {
        order: ["Foundations", "Atoms", "Molecules", "Organisms", "Screens"],
      },
    },
  },
};

export default preview;
