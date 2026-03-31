import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoBadge } from "@/components/duo";

const meta = {
  title: "Atoms/DuoBadge",
  component: DuoBadge,
  tags: ["autodocs"],
  args: {
    children: "Ativo",
    variant: "success",
  },
} satisfies Meta<typeof DuoBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Ativo")).toBeVisible();
  },
};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <DuoBadge variant="primary">Primary</DuoBadge>
      <DuoBadge variant="secondary">Secondary</DuoBadge>
      <DuoBadge variant="accent">Accent</DuoBadge>
      <DuoBadge variant="success">Success</DuoBadge>
      <DuoBadge variant="warning">Warning</DuoBadge>
      <DuoBadge variant="danger">Danger</DuoBadge>
      <DuoBadge variant="muted">Muted</DuoBadge>
    </div>
  ),
};
