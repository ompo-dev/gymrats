import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { AddEquipmentModal } from "./add-equipment-modal";

const meta = {
  title: "Organisms/Gym/AddEquipmentModal",
  component: AddEquipmentModal,
  args: {
    isOpen: true,
    onClose: fn(),
    onSuccess: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AddEquipmentModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Create: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Adicionar Equipamento/i)).toBeVisible();
    await expect(canvas.getByLabelText(/Nome/i)).toBeVisible();
  },
};

export const Edit: Story = {
  args: {
    equipmentToEdit: {
      id: "equipment-1",
      name: "Bike Indoor 07",
      type: "cardio",
      brand: "Movement",
      model: "MX7",
      serialNumber: "BIKE-007",
      purchaseDate: new Date("2025-01-10T00:00:00.000Z"),
      status: "maintenance",
      usageStats: {
        totalUses: 84,
        avgUsageTime: 27,
        popularTimes: [],
      },
      maintenanceHistory: [],
    },
  },
};
