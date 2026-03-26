import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  createGymStudentDetailFixture,
  gymStudentFixture,
} from "./gym-student-detail-story-fixtures";
import { ProgressTab } from "./progress-tab";

const meta = {
  title: "Organisms/Gym/StudentDetail/ProgressTab",
  component: ProgressTab,
  tags: ["autodocs"],
  args: {
    student: gymStudentFixture,
  },
} satisfies Meta<typeof ProgressTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nivel 9/i)).toBeVisible();
    await expect(canvas.getByText(/1680 \/ 2100 XP/i)).toBeVisible();
  },
};

export const NoWeeklyActivity: Story = {
  args: {
    student: createGymStudentDetailFixture({
      progress: {
        totalXP: 0,
        xpToNextLevel: 100,
        currentLevel: 1,
        weeklyXP: [0, 0, 0, 0, 0, 0, 0],
      } as never,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nivel 1/i)).toBeVisible();
    await expect(canvas.getByText(/0 \/ 100 XP/i)).toBeVisible();
  },
};
