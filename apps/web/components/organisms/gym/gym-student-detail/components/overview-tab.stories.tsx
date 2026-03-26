import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  createGymStudentDetailFixture,
  gymStudentFixture,
} from "./gym-student-detail-story-fixtures";
import { OverviewTab } from "./overview-tab";

const meta = {
  title: "Organisms/Gym/StudentDetail/OverviewTab",
  component: OverviewTab,
  tags: ["autodocs"],
  args: {
    student: gymStudentFixture,
  },
} satisfies Meta<typeof OverviewTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Plano Premium/i)).toBeVisible();
    await expect(canvas.getByText(/Objetivos/i)).toBeVisible();
  },
};

export const EmptySignals: Story = {
  args: {
    student: createGymStudentDetailFixture({
      assignedPersonals: [],
      favoriteEquipment: [],
      gymMembership: undefined,
      profile: {
        height: 168,
        fitnessLevel: "beginner",
        weeklyWorkoutFrequency: 3,
        goals: [],
      } as never,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nenhum objetivo definido/i)).toBeVisible();
    await expect(
      canvas.getByText(/Nenhum equipamento preferido/i),
    ).toBeVisible();
  },
};
