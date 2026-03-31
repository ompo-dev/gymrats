import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  StudentCardioScreen,
  type StudentCardioScreenProps,
} from "./student-cardio.screen";
import { createStudentCardioFixture } from "./student-cardio.fixture";

const meta = {
  component: StudentCardioScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "Screens/Student/StudentCardioScreen",
} satisfies Meta<StudentCardioScreenProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Menu: Story = {
  args: createStudentCardioFixture(),
};

export const CardioView: Story = {
  args: createStudentCardioFixture({
    view: "cardio",
  }),
};

export const FunctionalView: Story = {
  args: createStudentCardioFixture({
    view: "functional",
  }),
};
