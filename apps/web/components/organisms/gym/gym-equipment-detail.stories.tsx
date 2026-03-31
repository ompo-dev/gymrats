import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { fn } from "storybook/test";
import { createGymEquipmentFixture } from "@/components/screens/gym";
import { GymEquipmentDetail } from "./gym-equipment-detail";

const equipmentFixture = createGymEquipmentFixture().equipment[0] ?? null;

const meta = {
  title: "Organisms/Gym/GymEquipmentDetail",
  component: GymEquipmentDetail,
  args: {
    equipment: equipmentFixture,
    onBack: fn(),
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymEquipmentDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Bike Indoor 07/i)).toBeVisible();
    await expect(canvas.getByText(/Selecione a Categoria/i)).toBeVisible();
  },
};

export const MissingEquipment: Story = {
  args: {
    equipment: null,
  },
};
