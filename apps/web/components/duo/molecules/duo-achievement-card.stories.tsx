import type { Meta, StoryObj } from "@storybook/react";
import { Flame } from "lucide-react";
import { expect, within } from "storybook/test";
import { DuoAchievementCard } from "@/components/duo/molecules/duo-achievement-card";

const meta = {
  title: "Molecules/DuoAchievementCard",
  component: DuoAchievementCard.Simple,
  args: {
    icon: Flame,
    iconColor: "var(--duo-accent)",
    title: "Frequencia perfeita",
    description: "treinos completados",
    current: 18,
    total: 30,
    level: 4,
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DuoAchievementCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Frequencia perfeita/i)).toBeVisible();
    await expect(canvas.getByText("18/30")).toBeVisible();
  },
};

