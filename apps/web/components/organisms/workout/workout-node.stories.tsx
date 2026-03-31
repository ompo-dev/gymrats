import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import type { WorkoutSession } from "@/lib/types";
import { WorkoutNode } from "./workout-node";

const workoutFixture = {
  id: "workout-1",
  title: "Upper A",
  exercises: [
    { id: "exercise-1", name: "Supino" },
    { id: "exercise-2", name: "Desenvolvimento" },
  ],
  estimatedTime: 42,
  completed: false,
  locked: false,
} as unknown as WorkoutSession;

const meta = {
  title: "Organisms/Workout/WorkoutNode",
  component: WorkoutNode.Simple,
  tags: ["autodocs"],
  args: {
    position: "center",
    workout: workoutFixture,
    onClick: fn(),
    isFirst: false,
    previousWorkouts: [],
    previousUnitsWorkouts: [],
  },
} satisfies Meta<typeof WorkoutNode.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Current: Story = {
  args: {
    mockProgressPercent: 0,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onClick).toHaveBeenCalledWith(false);
  },
};

export const InProgress: Story = {
  args: {
    mockProgressPercent: 60,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Upper A/i)).toBeVisible();
    await expect(canvas.getByText(/2 exercicios/i)).toBeVisible();
  },
};

export const Completed: Story = {
  args: {
    workout: {
      ...workoutFixture,
      completed: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/42min/i)).toBeVisible();
  },
};

export const Rest: Story = {
  args: {
    variant: "rest",
    position: "left",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Descanso/i)).toBeVisible();
  },
};
