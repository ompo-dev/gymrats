import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { WorkoutHeader } from "./workout-header";

const meta = {
  title: "Organisms/Workout/WorkoutHeader",
  component: WorkoutHeader.Simple,
  tags: ["autodocs"],
  args: {
    onClose: fn(),
    hearts: 5,
    currentExercise: 2,
    totalExercises: 5,
    progress: 40,
    exerciseIds: ["exercise-1", "exercise-2", "exercise-3", "exercise-4", "exercise-5"],
    completedExerciseIds: ["exercise-1"],
    skippedExerciseIds: ["exercise-4"],
    skippedIndices: [3],
  },
} satisfies Meta<typeof WorkoutHeader.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Fechar workout/i }),
    );
    await expect(args.onClose).toHaveBeenCalled();
  },
};
