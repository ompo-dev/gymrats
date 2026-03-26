import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { WorkoutFooter } from "./workout-footer";
import {
  cardioExerciseFixture,
  strengthExerciseFixture,
} from "./workout-story-fixtures";

const meta = {
  title: "Organisms/Workout/WorkoutFooter",
  component: WorkoutFooter.Simple,
  tags: ["autodocs"],
  args: {
    isCardio: false,
    isRunning: false,
    currentExercise: strengthExerciseFixture,
    canGoBack: true,
    isLastExercise: false,
    onToggleCardio: fn(),
    onOpenWeightTracker: fn(),
    onOpenAlternatives: fn(),
    onCompleteCardio: fn(),
    onGoBack: fn(),
    onFinish: fn(),
    onSkip: fn(),
  },
} satisfies Meta<typeof WorkoutFooter.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StrengthMode: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /SERIES E CARGAS/i }));
    await expect(args.onOpenWeightTracker).toHaveBeenCalled();
  },
};

export const CardioMode: Story = {
  args: {
    isCardio: true,
    isRunning: true,
    currentExercise: cardioExerciseFixture,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /PAUSAR/i }));
    await expect(args.onToggleCardio).toHaveBeenCalled();
  },
};

export const LastExercise: Story = {
  args: {
    isLastExercise: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /FINALIZAR/i }));
    await expect(args.onFinish).toHaveBeenCalled();
  },
};
