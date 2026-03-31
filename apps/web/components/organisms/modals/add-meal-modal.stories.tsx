import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { AddMealModal } from "./add-meal-modal";

const meta = {
  title: "Organisms/Modals/AddMealModal",
  component: AddMealModal.Simple,
  args: {
    onClose: fn(),
    onAddMeal: fn(),
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AddMealModal.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Adicionar Refeicao/i)).toBeVisible();
    await expect(
      canvas.getByText(/Selecione as refeicoes/i),
    ).toBeVisible();
  },
};
