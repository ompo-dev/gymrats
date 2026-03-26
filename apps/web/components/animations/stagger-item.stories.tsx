import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { StaggerItem } from "@/components/animations/stagger-item";

const meta = {
  title: "Animations/StaggerItem",
  component: StaggerItem,
  args: {
    children: (
      <div className="rounded-3xl bg-[#1cb0f6] px-5 py-8 text-center text-sm font-semibold text-white">
        Item individual da sequencia
      </div>
    ),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StaggerItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Item individual da sequencia/i),
    ).toBeVisible();
  },
};

