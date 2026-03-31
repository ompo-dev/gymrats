import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { ExerciseCardView } from "./exercise-card-view";
import { strengthExerciseFixture } from "./workout-story-fixtures";

const meta = {
  title: "Organisms/Workout/ExerciseCardView",
  component: ExerciseCardView.Simple,
  tags: ["autodocs"],
  args: {
    exercise: strengthExerciseFixture,
    exerciseName: "Supino Reto",
    hasAlternative: false,
    isCardio: false,
    elapsedTime: 0,
    xpPerExercise: 45,
    onViewEducation: fn(),
    isCompleted: false,
    completedSetsCount: 0,
  },
} satisfies Meta<typeof ExerciseCardView.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Supino Reto/i)).toBeVisible();
    await expect(canvas.getByText(/\+45/i)).toBeVisible();
  },
};

export const Completed: Story = {
  args: {
    isCompleted: true,
    completedSetsCount: 4,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/4/i)).toBeVisible();
  },
};

export const WithEducation: Story = {
  args: {
    hasAlternative: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Ver/i }));
    await expect(args.onViewEducation).toHaveBeenCalledWith("education-1");
  },
};
