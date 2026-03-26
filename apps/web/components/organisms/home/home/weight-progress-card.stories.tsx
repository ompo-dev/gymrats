import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";

const meta = {
  title: "Organisms/Home/WeightProgressCard",
  component: WeightProgressCard.Simple,
  tags: ["autodocs"],
  args: {
    currentWeight: 81.4,
    weightGain: -1.6,
    hasWeightLossGoal: true,
    weightHistory: [
      { date: "2026-03-20", weight: 83.1 },
      { date: "2026-03-21", weight: 82.8 },
      { date: "2026-03-22", weight: 82.5 },
      { date: "2026-03-23", weight: 82.0 },
      { date: "2026-03-24", weight: 81.8 },
      { date: "2026-03-25", weight: 81.6 },
      { date: "2026-03-26", weight: 81.4 },
    ],
  },
} satisfies Meta<typeof WeightProgressCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/81.4 kg/i)).toBeVisible();
    await expect(canvas.getByText(/-1.6 kg/i)).toBeVisible();
  },
};
