import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createGymStatsFixture } from "@/components/screens/gym";
import { GymStatsPage } from "./gym-stats";

const meta = {
  title: "Organisms/Gym/GymStatsPage",
  component: GymStatsPage,
  args: createGymStatsFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymStatsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Check-ins Hoje/i)).toBeVisible();
    await expect(canvas.getByText(/Bike Indoor 07/i)).toBeVisible();
  },
};

export const EmptyEquipment: Story = {
  args: createGymStatsFixture({
    equipment: [],
  }),
};
