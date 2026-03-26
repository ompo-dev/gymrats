import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { MuscleExplorer } from "./muscle-explorer";

const meta = {
  title: "Organisms/Education/MuscleExplorer",
  component: MuscleExplorer.Simple,
  tags: ["autodocs"],
  args: {
    muscleId: undefined,
    exerciseId: undefined,
    onMuscleSelect: fn(),
    onExerciseSelect: fn(),
    onBack: fn(),
  },
} satisfies Meta<typeof MuscleExplorer.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MusclesView: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Biblioteca de Conhecimento/i),
    ).toBeVisible();
    await expect(canvas.getByText(/Peitoral Maior/i)).toBeVisible();
  },
};

export const ExerciseDeepLink: Story = {
  args: {
    exerciseId: "bench-press",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Supino Reto/i)).toBeVisible();
    await expect(canvas.getByText(/Como Executar/i)).toBeVisible();
  },
};
