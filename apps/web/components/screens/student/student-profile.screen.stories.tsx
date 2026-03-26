import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createStudentProfileFixture,
  StudentProfileScreen,
} from "@/components/screens/student";

const meta = {
  title: "Screens/Student/StudentProfile",
  component: StudentProfileScreen,
  args: createStudentProfileFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StudentProfileScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyStates: Story = {
  args: createStudentProfileFixture({
    currentWeight: null,
    weightGain: null,
    weightHistory: [],
    recentWorkoutHistory: [],
    personalRecords: [],
  }),
};
