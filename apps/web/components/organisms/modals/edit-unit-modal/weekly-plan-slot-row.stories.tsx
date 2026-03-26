import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  weeklyRestSlotFixture,
  weeklyWorkoutSlotFixture,
} from "./edit-unit-modal-story-fixtures";
import { WeeklyPlanSlotRow } from "./weekly-plan-slot-row";

const meta = {
  title: "Organisms/Modals/EditUnitModal/WeeklyPlanSlotRow",
  component: WeeklyPlanSlotRow,
  tags: ["autodocs"],
  args: {
    slot: weeklyRestSlotFixture,
    loadingSlotId: null,
    onAddWorkout: fn(),
    onOpenChat: fn(),
    onEditWorkout: fn(),
    onRemoveWorkout: fn(),
  },
} satisfies Meta<typeof WeeklyPlanSlotRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RestDay: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Treino/i }));
    await expect(args.onAddWorkout).toHaveBeenCalledWith("slot-2", "Terca");
  },
};

export const WorkoutDay: Story = {
  args: {
    slot: weeklyWorkoutSlotFixture,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Editar dia/i }));
    await expect(args.onEditWorkout).toHaveBeenCalledWith("workout-1");
  },
};
