import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { FadeIn } from "@/components/animations/fade-in";

const meta = {
  title: "Animations/FadeIn",
  component: FadeIn,
  args: {
    children: (
      <div className="rounded-3xl border border-dashed border-[#d7dbdf] bg-white px-6 py-10 text-center text-sm font-semibold text-[#3c3c3c]">
        Conteudo com entrada progressiva
      </div>
    ),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FadeIn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Conteudo com entrada progressiva/i),
    ).toBeVisible();
  },
};

