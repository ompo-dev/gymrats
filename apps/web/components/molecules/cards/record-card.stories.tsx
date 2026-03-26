import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { RecordCard } from "@/components/molecules/cards/record-card";

const meta = {
  title: "Molecules/Cards/RecordCard",
  component: RecordCard.Simple,
  args: {
    exerciseName: "Agachamento livre",
    date: "26/03/2026",
    value: 140,
    unit: "kg",
    previousBest: 132,
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RecordCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Agachamento livre/i)).toBeVisible();
    await expect(canvas.getByText("+8")).toBeVisible();
  },
};

