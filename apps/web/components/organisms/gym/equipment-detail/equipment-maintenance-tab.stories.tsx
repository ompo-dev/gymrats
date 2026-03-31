import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  availableEquipmentFixture,
  maintenanceEmptyEquipmentFixture,
} from "./equipment-story-fixtures";
import { EquipmentMaintenanceTab } from "./equipment-maintenance-tab";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentMaintenanceTab",
  component: EquipmentMaintenanceTab,
  tags: ["autodocs"],
  args: {
    equipment: availableEquipmentFixture,
  },
} satisfies Meta<typeof EquipmentMaintenanceTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithHistory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Lubrificacao geral e calibracao da estrutura/i),
    ).toBeVisible();
    await expect(canvas.getByText(/R\\$ 450.00/i)).toBeVisible();
  },
};

export const EmptyState: Story = {
  args: {
    equipment: maintenanceEmptyEquipmentFixture,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeVisible();
  },
};
