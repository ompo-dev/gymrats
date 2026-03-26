import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoButton } from "@/components/duo";

const meta = {
  title: "Atoms/DuoButton",
  component: DuoButton,
  tags: ["autodocs"],
  args: {
    children: "Registrar Check-in",
    variant: "primary",
    size: "md",
  },
} satisfies Meta<typeof DuoButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: /Registrar Check-in/i }),
    ).toBeVisible();
  },
};

export const VariantMatrix: Story = {
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <DuoButton>Primário</DuoButton>
      <DuoButton variant="secondary">Secundário</DuoButton>
      <DuoButton variant="accent">Accent</DuoButton>
      <DuoButton variant="outline">Outline</DuoButton>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Primário" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Secundário" }),
    ).toBeVisible();
  },
};
