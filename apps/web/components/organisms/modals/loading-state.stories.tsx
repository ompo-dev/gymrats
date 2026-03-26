import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { LoadingState } from "./loading-state";

const meta = {
  title: "Organisms/Modals/LoadingState",
  component: LoadingState.Simple,
  tags: ["autodocs"],
  args: {
    message: "Carregando biblioteca de treinos...",
  },
} satisfies Meta<typeof LoadingState.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Carregando biblioteca de treinos/i),
    ).toBeVisible();
  },
};
