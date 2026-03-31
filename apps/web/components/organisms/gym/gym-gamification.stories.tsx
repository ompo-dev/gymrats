import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createGymGamificationFixture } from "@/components/screens/gym";
import { GymGamificationPage } from "./gym-gamification";

const meta = {
  title: "Organisms/Gym/GymGamificationPage",
  component: GymGamificationPage,
  args: createGymGamificationFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymGamificationPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GymRats Paulista/i)).toBeVisible();
    await expect(canvas.getByText(/Comunidade Ativa/i)).toBeVisible();
  },
};
