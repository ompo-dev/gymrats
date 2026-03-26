import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoColorPicker } from "@/components/duo";

const meta = {
  title: "Organisms/DuoColorPicker",
  component: DuoColorPicker.Simple,
  tags: ["autodocs"],
} satisfies Meta<typeof DuoColorPicker.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Full: Story = {
  render: () => (
    <div className="max-w-3xl">
      <DuoColorPicker.Simple />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Tema")).toBeVisible();
    await expect(
      canvas.getByText(/Adicionar Tema Personalizado/i),
    ).toBeVisible();
  },
};

export const Compact: Story = {
  render: () => (
    <div className="rounded-2xl border border-[var(--duo-border)] p-4">
      <DuoColorPicker.Simple compact />
    </div>
  ),
};
