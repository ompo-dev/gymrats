import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { gymStudentFixture, gymStudentPaymentsFixture } from "./gym-student-detail/components/gym-student-detail-story-fixtures";
import { GymStudentDetail } from "./gym-student-detail";

const meta = {
  title: "Organisms/Gym/GymStudentDetail",
  component: GymStudentDetail,
  args: {
    student: gymStudentFixture,
    payments: gymStudentPaymentsFixture,
    onBack: () => undefined,
    variant: "gym",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymStudentDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
