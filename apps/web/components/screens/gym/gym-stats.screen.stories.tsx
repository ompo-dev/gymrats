import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createGymStatsFixture, GymStatsScreen } from "@/components/screens/gym";

const meta = {
  title: "Screens/Gym/GymStats",
  component: GymStatsScreen,
  args: createGymStatsFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymStatsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyCharts: Story = {
  args: createGymStatsFixture({
    stats: {
      ...createGymStatsFixture().stats,
      week: {
        ...createGymStatsFixture().stats.week,
        checkinsByDay: [],
        checkinsByHour: [],
      },
    },
  }),
};
