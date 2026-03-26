import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { LoadingMoreState } from "./loading-more-state";

const meta = {
  title: "Organisms/Modals/LoadingMoreState",
  component: LoadingMoreState,
  tags: ["autodocs"],
  args: {
    message: "Carregando mais resultados...",
  },
} satisfies Meta<typeof LoadingMoreState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Carregando mais resultados/i),
    ).toBeVisible();
  },
};
