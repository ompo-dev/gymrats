import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { MaintenanceModal } from "./maintenance-modal";

const meta = {
  title: "Organisms/Gym/MaintenanceModal",
  component: MaintenanceModal,
  args: {
    isOpen: true,
    onClose: fn(),
    equipmentId: "equipment-1",
    onSuccess: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof MaintenanceModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Registrar Manutencao/i)).toBeVisible();
    await expect(canvas.getByLabelText(/Descricao/i)).toBeVisible();
  },
};
