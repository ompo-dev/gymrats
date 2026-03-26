import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { FunctionalWorkout } from "./functional-workout";

const meta = {
  title: "Organisms/Workout/FunctionalWorkout",
  component: FunctionalWorkout.Simple,
  tags: ["autodocs"],
} satisfies Meta<typeof FunctionalWorkout.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Treino Funcional/i)).toBeVisible();
    await expect(canvas.getAllByText(/Categoria|Para quem/i).length).toBeGreaterThan(0);
  },
};
