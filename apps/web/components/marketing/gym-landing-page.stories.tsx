import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GymLandingPage } from "@/components/marketing/gym-landing-page";

const meta = {
  title: "Marketing/GymLandingPage",
  component: GymLandingPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymLandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

