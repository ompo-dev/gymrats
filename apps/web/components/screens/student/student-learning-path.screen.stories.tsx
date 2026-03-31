import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  StudentLearningPathScreen,
  type StudentLearningPathScreenProps,
} from "./student-learning-path.screen";
import { createStudentLearningPathFixture } from "./student-learning-path.fixture";

const meta = {
  component: StudentLearningPathScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "Screens/Student/StudentLearningPathScreen",
} satisfies Meta<StudentLearningPathScreenProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: createStudentLearningPathFixture(),
};

export const PlannedState: Story = {
  args: createStudentLearningPathFixture({
    hasPlan: true,
  }),
};
