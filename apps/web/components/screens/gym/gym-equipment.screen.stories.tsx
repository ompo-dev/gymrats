import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createGymEquipmentFixture,
  GymEquipmentScreen,
} from "@/components/screens/gym";

const meta = {
  title: "Screens/Gym/GymEquipment",
  component: GymEquipmentScreen,
  args: createGymEquipmentFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymEquipmentScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  args: createGymEquipmentFixture({
    equipment: [],
    statsOverview: {
      total: 0,
      available: 0,
      inUse: 0,
      maintenance: 0,
    },
  }),
};
