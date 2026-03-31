import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { StreakModal } from "./streak-modal";

const meta = {
  title: "Organisms/Modals/StreakModal",
  component: StreakModal.Simple,
  args: {
    open: true,
    onClose: fn(),
    currentStreak: 12,
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof StreakModal.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/12 dias de sequencia/i)).toBeVisible();
  },
};

export const FirstDay: Story = {
  args: {
    currentStreak: 1,
  },
};
