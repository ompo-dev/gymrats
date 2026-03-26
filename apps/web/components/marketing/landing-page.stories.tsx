import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LandingPage } from "@/components/marketing/landing-page";

const meta = {
  title: "Marketing/LandingPage",
  component: LandingPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

