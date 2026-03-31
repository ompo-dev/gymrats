import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  StudentMuscleExplorerScreen,
  type StudentMuscleExplorerScreenProps,
} from "./student-muscle-explorer.screen";
import { createStudentMuscleExplorerFixture } from "./student-muscle-explorer.fixture";

const meta = {
  component: StudentMuscleExplorerScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "Screens/Student/StudentMuscleExplorerScreen",
} satisfies Meta<StudentMuscleExplorerScreenProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MusclesView: Story = {
  args: createStudentMuscleExplorerFixture(),
};

export const ExercisesView: Story = {
  args: createStudentMuscleExplorerFixture({
    view: "exercises",
  }),
};
