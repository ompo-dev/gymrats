import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { MuscleDetail } from "./muscle-detail";
import { muscleLibrary } from "./muscle-story-fixtures";

const meta = {
  title: "Organisms/Education/Muscle/MuscleDetail",
  component: MuscleDetail,
  tags: ["autodocs"],
  args: {
    muscle: muscleLibrary[0],
    onBack: fn(),
  },
} satisfies Meta<typeof MuscleDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Peitoral Maior/i)).toBeVisible();
    await expect(canvas.getByText(/Exercicios Comuns/i)).toBeVisible();
  },
};
