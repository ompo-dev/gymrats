import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { ContinueWorkoutCard } from "@/components/organisms/home/home/continue-workout-card";

type ContinueWorkoutProps = Parameters<typeof ContinueWorkoutCard.Simple>[0];

const unitsWithNextWorkout = [
  {
    id: "unit-upper",
    title: "Upper body",
    description: "Peito e ombro",
    color: "#58CC02",
    icon: "dumbbell",
    workouts: [
      {
        id: "workout-a",
        title: "Supino e desenvolvimento",
        description: "Forca",
        type: "strength",
        muscleGroup: "peito",
        difficulty: "intermediario",
        exercises: [],
        xpReward: 40,
        estimatedTime: 50,
        locked: false,
        completed: false,
      },
    ],
  },
] as ContinueWorkoutProps["units"];

const workoutHistory = [
  {
    date: new Date("2026-03-25T10:00:00Z"),
    workoutId: "hist-1",
    workoutName: "Treino de pernas",
    duration: 48,
    totalVolume: 6200,
    exercises: [],
    bodyPartsFatigued: ["pernas"],
  },
] as ContinueWorkoutProps["workoutHistory"];

const meta = {
  title: "Organisms/Home/ContinueWorkoutCard",
  component: ContinueWorkoutCard.Simple,
  tags: ["autodocs"],
} satisfies Meta<typeof ContinueWorkoutCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NextWorkout: Story = {
  args: {
    units: unitsWithNextWorkout,
    workoutHistory,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Supino e desenvolvimento/i)).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Continuar Treino/i }),
    ).toBeVisible();
  },
};

export const EmptyState: Story = {
  args: {
    units: [],
    workoutHistory: [],
  },
};

export const LastCompleted: Story = {
  args: {
    units: [],
    workoutHistory,
  },
};
