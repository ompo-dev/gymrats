import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { WeightTrackerOverlay } from "./weight-tracker-overlay";
import {
  completedExerciseLogFixture,
  strengthExerciseFixture,
} from "./workout-story-fixtures";

const meta = {
  title: "Organisms/Workout/WeightTrackerOverlay",
  component: WeightTrackerOverlay.Simple,
  tags: ["autodocs"],
  args: {
    isOpen: true,
    onClose: fn(),
    exerciseName: "Supino Reto",
    exercise: strengthExerciseFixture,
    progress: 40,
    currentExercise: 2,
    totalExercises: 5,
    exerciseIds: [
      "exercise-1",
      "exercise-strength-1",
      "exercise-3",
      "exercise-4",
      "exercise-5",
    ],
    completedExerciseIds: ["exercise-1"],
    skippedExerciseIds: [],
    skippedIndices: [],
    currentExerciseId: "exercise-strength-1",
    onComplete: fn(),
    onSaveProgress: fn(),
    existingLog: completedExerciseLogFixture,
    isUnilateral: false,
  },
} satisfies Meta<typeof WeightTrackerOverlay.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Supino Reto/i)).toBeVisible();
    await expect(canvas.getByText(/Completado/i)).toBeVisible();
  },
};

export const Close: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClose).toHaveBeenCalled();
  },
};
