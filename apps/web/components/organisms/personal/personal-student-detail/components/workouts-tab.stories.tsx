import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  weeklyPlanFixture,
} from "./personal-student-detail-story-fixtures";
import { PersonalWorkoutsTab } from "./workouts-tab";

const meta = {
  title: "Organisms/Personal/StudentDetail/PersonalWorkoutsTab",
  component: PersonalWorkoutsTab,
  tags: ["autodocs"],
  args: {
    weeklyPlan: weeklyPlanFixture,
    isLoadingWeeklyPlan: false,
  },
} satisfies Meta<typeof PersonalWorkoutsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Plano Semanal/i)).toBeVisible();
    await expect(canvas.getByText(/Upper A/i)).toBeVisible();
  },
};

export const Loading: Story = {
  args: {
    isLoadingWeeklyPlan: true,
    weeklyPlan: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Plano Semanal/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    weeklyPlan: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Aluno ainda nao possui plano semanal/i),
    ).toBeVisible();
  },
};
