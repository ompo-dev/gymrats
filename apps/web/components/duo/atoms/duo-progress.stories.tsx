import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoProgress } from "@/components/duo";

const meta = {
  title: "Atoms/DuoProgress",
  component: DuoProgress,
  tags: ["autodocs"],
  args: {
    value: 72,
    showLabel: true,
    variant: "primary",
  },
} satisfies Meta<typeof DuoProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar")).toBeVisible();
    await expect(canvas.getByText("72%")).toBeVisible();
  },
};

export const Matrix: Story = {
  render: () => (
    <div className="grid gap-4">
      <DuoProgress showLabel value={30} variant="primary" />
      <DuoProgress showLabel value={55} variant="secondary" />
      <DuoProgress showLabel value={68} variant="accent" />
      <DuoProgress showLabel value={84} variant="success" />
      <DuoProgress showLabel value={92} variant="warning" />
      <DuoProgress showLabel value={18} variant="danger" />
    </div>
  ),
};
