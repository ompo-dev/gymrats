import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  StudentDietScreen,
  type StudentDietScreenProps,
} from "./student-diet.screen";
import { createStudentDietFixture } from "./student-diet.fixture";

const meta = {
  component: StudentDietScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "Screens/Student/StudentDietScreen",
} satisfies Meta<StudentDietScreenProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: createStudentDietFixture(),
};
