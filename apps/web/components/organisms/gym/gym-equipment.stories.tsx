import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createGymEquipmentFixture } from "@/components/screens/gym";
import { GymEquipmentPage } from "./gym-equipment";

const meta = {
  title: "Organisms/Gym/GymEquipmentPage",
  component: GymEquipmentPage,
  args: {
    equipment: createGymEquipmentFixture().equipment,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymEquipmentPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Bike Indoor 07/i)).toBeVisible();
    await expect(canvas.getByText(/Leg Press 45/i)).toBeVisible();
  },
};

export const EmptyState: Story = {
  args: {
    equipment: [],
  },
};
