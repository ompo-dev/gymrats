import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { availableEquipmentFixture } from "./equipment-story-fixtures";
import { EquipmentUsageTab } from "./equipment-usage-tab";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentUsageTab",
  component: EquipmentUsageTab,
  tags: ["autodocs"],
  args: {
    equipment: availableEquipmentFixture,
  },
} satisfies Meta<typeof EquipmentUsageTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/07:00 - 09:00/i)).toBeVisible();
    await expect(canvas.getByText(/Taxa de Utilizacao/i)).toBeVisible();
  },
};
