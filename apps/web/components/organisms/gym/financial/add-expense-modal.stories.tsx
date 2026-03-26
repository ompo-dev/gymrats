import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { AddExpenseModal } from "./add-expense-modal";

const meta = {
  title: "Organisms/Gym/Financial/AddExpenseModal",
  component: AddExpenseModal,
  args: {
    isOpen: true,
    onClose: fn(),
    onSuccess: fn(),
    variant: "gym",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AddExpenseModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Gym: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nova Despesa/i)).toBeVisible();
    await expect(canvas.getByLabelText(/Valor/i)).toBeVisible();
  },
};

export const Personal: Story = {
  args: {
    variant: "personal",
  },
};
