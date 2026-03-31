import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  StudentEducationScreen,
  type StudentEducationScreenProps,
} from "./student-education.screen";
import { createStudentEducationFixture } from "./student-education.fixture";

const meta = {
  component: StudentEducationScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "Screens/Student/StudentEducationScreen",
} satisfies Meta<StudentEducationScreenProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: createStudentEducationFixture(),
};
