import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { RelativeTime } from "@/components/molecules/relative-time";

const meta = {
  title: "Molecules/RelativeTime",
  component: RelativeTime,
  args: {
    timestamp: Date.now() - 5 * 60 * 1000,
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RelativeTime>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/atr/i)).toBeVisible();
  },
};
