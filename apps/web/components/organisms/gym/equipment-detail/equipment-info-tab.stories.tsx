import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { availableEquipmentFixture } from "./equipment-story-fixtures";
import { EquipmentInfoTab } from "./equipment-info-tab";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentInfoTab",
  component: EquipmentInfoTab,
  tags: ["autodocs"],
  args: {
    equipment: availableEquipmentFixture,
  },
} satisfies Meta<typeof EquipmentInfoTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Marca/i)).toBeVisible();
    await expect(canvas.getByText(/Movement/i)).toBeVisible();
  },
};
