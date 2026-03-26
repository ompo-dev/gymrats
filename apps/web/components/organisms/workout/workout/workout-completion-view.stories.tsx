import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { WorkoutCompletionView } from "./workout-completion-view";
import {
  completedExerciseLogFixture,
  workoutSessionFixture,
} from "./workout-story-fixtures";

const meta = {
  title: "Organisms/Workout/WorkoutCompletionView",
  component: WorkoutCompletionView.Simple,
  tags: ["autodocs"],
  args: {
    workout: workoutSessionFixture,
    workoutData: {
      exerciseLogs: [completedExerciseLogFixture],
      xpEarned: 120,
      totalTime: 1480,
      skippedExercises: [],
    },
    totalVolume: 760,
    onClose: fn(),
    onRepeat: fn(),
  },
} satisfies Meta<typeof WorkoutCompletionView.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Treino Completo/i)).toBeVisible();
    await expect(canvas.getByText(/Upper A/i)).not.toBeInTheDocument();
  },
};

export const Repeat: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /FAZER NOVAMENTE|REFAZER/i }),
    );
    await expect(args.onRepeat).toHaveBeenCalled();
  },
};
