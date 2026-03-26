import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createGymFinancialFixture } from "@/components/screens/gym";
import { createStudentDirectoryFixture } from "@/components/screens/shared/student-directory.fixture";
import { GymStudentsPage } from "./gym-students";

const gymStudentFixture = createStudentDirectoryFixture();
const gymFinancialFixture = createGymFinancialFixture();

const meta = {
  title: "Organisms/Gym/GymStudentsPage",
  component: GymStudentsPage,
  args: {
    students: gymStudentFixture.students,
    membershipPlans: gymFinancialFixture.plans,
    variant: "gym",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymStudentsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
    await expect(canvas.getByText(/Marcos Lima/i)).toBeVisible();
  },
};

export const PersonalVariant: Story = {
  args: {
    students: gymStudentFixture.students,
    membershipPlans: [],
    variant: "personal",
    personalAffiliations: gymStudentFixture.personalAffiliations,
  },
};
