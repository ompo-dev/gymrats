import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  weeklyPlanSlotsFixture,
  workoutExerciseFixture,
  workoutSessionFixture,
} from "./edit-unit-modal-story-fixtures";
import { WorkoutDetailView } from "./workout-detail-view";

const meta = {
  title: "Organisms/Modals/EditUnitModal/WorkoutDetailView",
  component: WorkoutDetailView,
  tags: ["autodocs"],
  args: {
    workoutTitle: "Upper A",
    workoutMuscleGroup: "peito",
    onWorkoutTitleChange: fn(),
    onWorkoutTitleBlur: fn(),
    onMuscleGroupChange: fn(),
    activeWorkoutId: "workout-1",
    calculatedEstimatedTime: 48,
    exerciseItems: workoutSessionFixture.exercises,
    onReorderExercises: fn(),
    onUpdateExercise: fn(),
    onAddExercise: fn(),
    onDeleteExercise: fn(),
    isWeeklyPlanMode: true,
    weeklyPlan: { id: "weekly-plan-1" },
    planSlots: weeklyPlanSlotsFixture,
    onOpenSlotChat: fn(),
    onOpenWorkoutChat: fn(),
  },
} satisfies Meta<typeof WorkoutDetailView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue(/Upper A/i)).toBeVisible();
    await expect(canvas.getByDisplayValue(/Supino Reto/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    exerciseItems: [],
    calculatedEstimatedTime: 0,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Exercicio/i }));
    await expect(args.onAddExercise).toHaveBeenCalled();
  },
};
