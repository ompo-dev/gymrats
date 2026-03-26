import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { EmptyState } from "./empty-state";

const meta = {
  title: "Organisms/Modals/EmptyState",
  component: EmptyState.Simple,
  tags: ["autodocs"],
  args: {
    message: "Nenhum item encontrado para este filtro.",
  },
} satisfies Meta<typeof EmptyState.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Nenhum item encontrado para este filtro/i),
    ).toBeVisible();
  },
};
