import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createStudentDirectoryFixture,
  StudentDirectoryScreen,
} from "@/components/screens/shared";

const meta = {
  title: "Screens/Shared/StudentDirectory",
  component: StudentDirectoryScreen,
  args: createStudentDirectoryFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StudentDirectoryScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GymDirectory: Story = {};

export const PersonalDirectory: Story = {
  args: createStudentDirectoryFixture({
    variant: "personal",
    networkFilter: "gym",
  }),
};

export const EmptyState: Story = {
  args: createStudentDirectoryFixture({
    students: [],
  }),
};
