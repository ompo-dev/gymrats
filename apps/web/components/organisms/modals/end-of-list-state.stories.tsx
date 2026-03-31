import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { EndOfListState } from "./end-of-list-state";

const meta = {
  title: "Organisms/Modals/EndOfListState",
  component: EndOfListState.Simple,
  tags: ["autodocs"],
  args: {
    total: 42,
    itemName: "exercicios",
  },
} satisfies Meta<typeof EndOfListState.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/42 total/i)).toBeVisible();
  },
};
