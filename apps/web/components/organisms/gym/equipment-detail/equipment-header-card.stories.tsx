import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { availableEquipmentFixture } from "./equipment-story-fixtures";
import { EquipmentHeaderCard } from "./equipment-header-card";

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentHeaderCard",
  component: EquipmentHeaderCard,
  tags: ["autodocs"],
  args: {
    equipment: availableEquipmentFixture,
  },
} satisfies Meta<typeof EquipmentHeaderCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Leg Press 45/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Editar/i })).toBeVisible();
  },
};
