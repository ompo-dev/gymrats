import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

const meta = {
  title: "Organisms/Modals/DeleteConfirmationModal",
  component: DeleteConfirmationModal,
  tags: ["autodocs"],
  args: {
    isOpen: true,
    onConfirm: fn(),
    onCancel: fn(),
    title: "Excluir treino?",
    message: "Essa acao remove o treino da semana atual.",
  },
} satisfies Meta<typeof DeleteConfirmationModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Excluir treino/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Remover/i }));
    await expect(args.onConfirm).toHaveBeenCalled();
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText(/Excluir treino/i)).not.toBeInTheDocument();
  },
};
