import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { WhileInView } from "@/components/animations/while-in-view";

const meta = {
  title: "Animations/WhileInView",
  component: WhileInView,
  args: {
    children: (
      <div className="rounded-3xl border border-[#dfe4ea] bg-[#fefefe] px-6 py-8 text-center text-sm font-semibold text-[#414141]">
        Elemento preparado para revelar em viewport
      </div>
    ),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof WhileInView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Elemento preparado para revelar em viewport/i),
    ).toBeVisible();
  },
};

