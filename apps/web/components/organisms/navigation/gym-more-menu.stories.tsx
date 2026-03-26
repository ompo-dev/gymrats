import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GymMoreMenu } from "./gym-more-menu";

const meta = {
  title: "Organisms/Navigation/GymMoreMenu",
  component: GymMoreMenu.Simple,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymMoreMenu.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
