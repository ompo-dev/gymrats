import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { HistoryCard } from "@/components/molecules/cards/history-card";

const meta = {
  title: "Molecules/Cards/HistoryCard",
  component: HistoryCard.Simple,
  args: {
    title: "Treino de peito e triceps",
    date: new Date(),
    status: "excelente",
    metadata: [
      { icon: "🔥", label: "620 kcal" },
      { icon: "⏱️", label: "52 min" },
    ],
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HistoryCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Treino de peito e triceps/i)).toBeVisible();
    await expect(canvas.getByText("excelente")).toBeVisible();
  },
};

