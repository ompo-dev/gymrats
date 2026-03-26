import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { assignmentFixture } from "./personal-student-detail-story-fixtures";
import { PersonalProgressTab } from "./progress-tab";

const meta = {
  title: "Organisms/Personal/StudentDetail/PersonalProgressTab",
  component: PersonalProgressTab,
  tags: ["autodocs"],
  args: {
    progress: assignmentFixture.student.progress,
  },
} satisfies Meta<typeof PersonalProgressTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Progresso e XP/i)).toBeVisible();
    await expect(canvas.getByText(/Nivel/i)).toBeVisible();
  },
};
