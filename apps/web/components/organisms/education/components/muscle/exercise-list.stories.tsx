import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { ExerciseList } from "./exercise-list";
import {
  exerciseLibrary,
  getDifficultyClasses,
  groupedExercises,
  muscleGroupLabels,
} from "./muscle-story-fixtures";

const meta = {
  title: "Organisms/Education/Muscle/ExerciseList",
  component: ExerciseList,
  tags: ["autodocs"],
  args: {
    exercises: exerciseLibrary,
    exercisesByPrimaryMuscle: groupedExercises,
    searchQuery: "",
    onExerciseSelect: fn(),
    muscleGroupLabels,
    getDifficultyClasses,
  },
} satisfies Meta<typeof ExerciseList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Supino Reto/i)).toBeVisible();
    await expect(canvas.getByText(/Barra Fixa/i)).toBeVisible();
  },
};

export const SearchResults: Story = {
  args: {
    searchQuery: "barra",
    exercises: exerciseLibrary.slice(0, 2),
  },
};

export const Empty: Story = {
  args: {
    exercises: [],
    exercisesByPrimaryMuscle: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nenhum exercicio/i)).toBeVisible();
  },
};
