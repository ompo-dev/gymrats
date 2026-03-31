import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { availableEquipmentFixture } from "./equipment-story-fixtures";
import { EquipmentStatsGrid } from "./equipment-stats-grid";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentStatsGrid",
  component: EquipmentStatsGrid,
  tags: ["autodocs"],
  args: {
    equipment: availableEquipmentFixture,
  },
} satisfies Meta<typeof EquipmentStatsGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Total de Usos/i)).toBeVisible();
    await expect(canvas.getByText(/1460/i)).toBeVisible();
  },
};
