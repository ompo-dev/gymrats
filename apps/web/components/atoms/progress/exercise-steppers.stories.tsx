import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { ExerciseSteppers } from "@/components/atoms/progress/exercise-steppers";

const meta = {
  title: "Atoms/Progress/ExerciseSteppers",
  component: ExerciseSteppers,
  args: {
    exerciseIds: ["push", "pull", "squat", "core"],
    completedExerciseIds: ["push", "pull"],
    skippedExerciseIds: ["squat"],
    currentExerciseId: "core",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ExerciseSteppers>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const steps = canvasElement.querySelectorAll("[title]");
    await expect(steps.length).toBe(4);
  },
};

