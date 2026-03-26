import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Label } from "@/components/molecules/forms/label";

const meta = {
  title: "Molecules/Forms/Label",
  component: Label,
  args: {
    children: "Nome do plano",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid gap-2">
      <Label {...args} htmlFor="label-story-input" />
      <input
        id="label-story-input"
        className="h-11 rounded-xl border border-[#d7dbe3] px-4 text-sm"
        defaultValue="Plano Prime"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Nome do plano")).toBeVisible();
  },
};

