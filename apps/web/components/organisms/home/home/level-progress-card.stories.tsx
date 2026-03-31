import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { LevelProgressCard } from "@/components/organisms/home/home/level-progress-card";

const meta = {
  title: "Organisms/Home/LevelProgressCard",
  component: LevelProgressCard.Simple,
  tags: ["autodocs"],
  args: {
    currentLevel: 7,
    totalXP: 680,
    xpToNextLevel: 20,
    ranking: 12,
  },
} satisfies Meta<typeof LevelProgressCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nivel 7/i)).toBeVisible();
    await expect(canvas.getByText(/680 XP/i)).toBeVisible();
  },
};
