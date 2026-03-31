import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  StudentPersonalListWithFiltersScreen,
  type StudentPersonalListWithFiltersScreenProps,
} from "./student-personal-list-with-filters.screen";
import { createStudentPersonalListWithFiltersFixture } from "./student-personal-list-with-filters.fixture";

const meta = {
  component: StudentPersonalListWithFiltersScreen,
  parameters: {
    layout: "fullscreen",
  },
  title: "Screens/Student/StudentPersonalListWithFiltersScreen",
} satisfies Meta<StudentPersonalListWithFiltersScreenProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: createStudentPersonalListWithFiltersFixture(),
};
