import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { WorkoutPreviewCard } from "./workout-preview-card";

const workoutFixture = {
  title: "Upper A",
  description: "Treino de peito e ombros",
  type: "strength" as const,
  muscleGroup: "peito",
  difficulty: "intermediario" as const,
  exercises: [
    {
      name: "Supino Reto",
      sets: 4,
      reps: "8-10",
      rest: 90,
      notes: "Controlar a descida",
      alternatives: ["Chest Press"],
    },
    {
      name: "Desenvolvimento",
      sets: 3,
      reps: "10-12",
      rest: 60,
    },
  ],
};

const meta = {
  title: "Organisms/Modals/WorkoutPreviewCard",
  component: WorkoutPreviewCard,
  tags: ["autodocs"],
  args: {
    workout: workoutFixture,
    index: 0,
    displayNumber: 1,
    variant: "default",
    defaultExpanded: false,
    isStreaming: false,
    onReference: fn(),
  },
} satisfies Meta<typeof WorkoutPreviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Upper A/i)).toBeVisible();
    await expect(canvas.getByText(/2 exercicios/i)).toBeVisible();
  },
};

export const Expanded: Story = {
  args: {
    defaultExpanded: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Supino Reto/i)).toBeVisible();
    await userEvent.click(canvas.getByText(/Supino Reto/i));
    await expect(canvas.getByText(/Chest Press/i)).toBeVisible();
  },
};

export const RestDay: Story = {
  args: {
    variant: "rest",
    workout: {
      ...workoutFixture,
      title: "Descanso",
      exercises: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Dia de descanso/i)).toBeVisible();
  },
};
