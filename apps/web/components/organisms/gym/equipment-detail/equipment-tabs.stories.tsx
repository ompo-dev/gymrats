import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { availableEquipmentFixture } from "./equipment-story-fixtures";
import { EquipmentTabs } from "./equipment-tabs";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentTabs",
  component: EquipmentTabs,
  tags: ["autodocs"],
  args: {
    equipment: availableEquipmentFixture,
  },
} satisfies Meta<typeof EquipmentTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tablist")).toBeVisible();
    await expect(canvas.getByText(/Total de Usos/i)).toBeVisible();
  },
};
