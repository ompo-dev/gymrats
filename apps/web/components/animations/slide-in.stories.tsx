import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { SlideIn } from "@/components/animations/slide-in";

const meta = {
  title: "Animations/SlideIn",
  component: SlideIn,
  args: {
    direction: "up",
    children: (
      <div className="rounded-3xl bg-[#f6f7fb] px-6 py-10 text-center text-sm font-semibold text-[#4b4b4b]">
        Bloco animado por direcao
      </div>
    ),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SlideIn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Bloco animado por direcao/i)).toBeVisible();
  },
};

export const Horizontal: Story = {
  args: {
    direction: "left",
  },
};

