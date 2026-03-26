import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { WeightTracker } from "./weight-tracker";

const meta = {
  title: "Organisms/Trackers/WeightTracker",
  component: WeightTracker.Simple,
  tags: ["autodocs"],
  args: {
    exerciseName: "Supino Reto",
    exerciseId: "bench-press",
    defaultSets: 4,
    defaultReps: "10-12",
    onComplete: fn(),
    onSaveProgress: fn(),
    existingLog: null,
    isUnilateral: false,
  },
} satisfies Meta<typeof WeightTracker.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole("spinbutton");
    await userEvent.type(inputs[0], "60");
    await userEvent.type(inputs[1], "10");
    await expect(canvas.getByRole("button", { name: /FINALIZAR/i })).toBeVisible();
  },
};

export const WithExistingLog: Story = {
  args: {
    existingLog: {
      id: "log-1",
      exerciseId: "bench-press",
      exerciseName: "Supino Reto",
      workoutId: "workout-1",
      date: new Date("2026-03-26T10:00:00.000Z"),
      difficulty: "ideal",
      sets: [
        {
          setNumber: 1,
          weight: 70,
          reps: 8,
          completed: true,
        },
      ],
      notes: "Carga consistente.",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Completado/i)).toBeVisible();
    await expect(canvas.getByText(/560kg volume/i)).toBeVisible();
  },
};
