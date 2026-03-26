import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createStudentHomeFixture,
  StudentHomeScreen,
} from "@/components/screens/student";

const meta = {
  title: "Screens/Student/StudentHome",
  component: StudentHomeScreen,
  args: createStudentHomeFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StudentHomeScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyProgress: Story = {
  args: createStudentHomeFixture({
    showLevelProgress: false,
    workoutHistory: [],
    units: [],
    dailyNutrition: null,
    currentWeight: null,
    weightGain: null,
    campaignsSlot: null,
    displayProgress: {
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      todayXP: 0,
      currentLevel: 1,
      xpToNextLevel: 100,
      workoutsCompleted: 0,
    },
  }),
};
