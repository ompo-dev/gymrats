import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { ProgressRing } from "@/components/atoms/progress/progress-ring";

const meta = {
  title: "Atoms/Progress/Ring",
  component: ProgressRing,
  args: {
    showProgress: true,
    progressPercent: 72,
    children: (
      <div className="flex size-20 items-center justify-center rounded-full bg-[#58cc02] text-xs font-black text-white">
        72%
      </div>
    ),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ProgressRing>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("72%")).toBeVisible();
  },
};

export const Hidden: Story = {
  args: {
    showProgress: false,
    progressPercent: 0,
    children: (
      <div className="flex size-20 items-center justify-center rounded-full bg-[#e5e7eb] text-xs font-black text-[#4b5563]">
        OFF
      </div>
    ),
  },
};

