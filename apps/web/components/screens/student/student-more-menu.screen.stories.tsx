import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createStudentMoreMenuFixture,
  StudentMoreMenuScreen,
} from "@/components/screens/student";

const meta = {
  title: "Screens/Student/StudentMoreMenu",
  component: StudentMoreMenuScreen,
  args: createStudentMoreMenuFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StudentMoreMenuScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StandardRole: Story = {
  args: createStudentMoreMenuFixture({
    items: createStudentMoreMenuFixture().items.filter(
      (item) =>
        !["home", "profile", "education", "theme-test"].includes(item.id),
    ),
  }),
};
