import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { assignmentFixture } from "./personal-student-detail-story-fixtures";
import { PersonalOverviewTab } from "./overview-tab";

const meta = {
  title: "Organisms/Personal/StudentDetail/PersonalOverviewTab",
  component: PersonalOverviewTab,
  tags: ["autodocs"],
  args: {
    studentEmail: assignmentFixture.student.user?.email ?? "",
    gymName: assignmentFixture.gym?.name,
    profile: assignmentFixture.student.profile,
  },
} satisfies Meta<typeof PersonalOverviewTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Informacoes do Perfil/i)).toBeVisible();
    await expect(canvas.getByText(/ganho de massa/i)).toBeVisible();
  },
};

export const NoGoals: Story = {
  args: {
    profile: {
      ...assignmentFixture.student.profile,
      goals: null,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nenhum objetivo definido/i)).toBeVisible();
  },
};
