import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { ExerciseDetail } from "./exercise-detail";
import {
  exerciseLibrary,
  getDifficultyClasses,
  muscleGroupLabels,
} from "./muscle-story-fixtures";

const meta = {
  title: "Organisms/Education/Muscle/ExerciseDetail",
  component: ExerciseDetail,
  tags: ["autodocs"],
  args: {
    exercise: exerciseLibrary[0],
    onBack: fn(),
    muscleGroupLabels,
    getDifficultyClasses,
  },
} satisfies Meta<typeof ExerciseDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Supino Reto/i)).toBeVisible();
    await expect(canvas.getByText(/Como Executar/i)).toBeVisible();
    await expect(canvas.getByText(/Beneficios/i)).toBeVisible();
  },
};
