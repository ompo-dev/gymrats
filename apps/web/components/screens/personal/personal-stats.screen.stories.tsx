import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createPersonalStatsFixture,
  PersonalStatsScreen,
} from "@/components/screens/personal";

const meta = {
  title: "Screens/Personal/PersonalStats",
  component: PersonalStatsScreen,
  args: createPersonalStatsFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalStatsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const IndependentOnly: Story = {
  args: createPersonalStatsFixture({
    gyms: 0,
    students: 8,
    studentsViaGym: 0,
    independentStudents: 8,
  }),
};
