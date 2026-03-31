import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  secondWorkoutSessionFixture,
  weeklyPlanSlotsFixture,
  workoutSessionFixture,
} from "./edit-unit-modal-story-fixtures";
import { WorkoutsListSection } from "./workouts-list-section";

const meta = {
  title: "Organisms/Modals/EditUnitModal/WorkoutsListSection",
  component: WorkoutsListSection,
  tags: ["autodocs"],
  args: {
    isWeeklyPlanMode: true,
    weeklyPlan: { id: "weekly-plan-1" },
    planSlots: weeklyPlanSlotsFixture,
    workoutItems: [workoutSessionFixture, secondWorkoutSessionFixture],
    loadingSlotId: null,
    onChatClick: fn(),
    onAddWorkoutToSlot: fn(),
    onRemoveWorkoutFromSlot: fn(),
    onEditWorkout: fn(),
    onReorderWorkouts: fn(),
    onCreateWorkout: fn(),
    onDeleteWorkoutClick: fn(),
    onOpenWorkoutChat: fn(),
  },
} satisfies Meta<typeof WorkoutsListSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WeeklyMode: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Chat$/i }));
    await expect(args.onChatClick).toHaveBeenCalledWith("slot-2");
  },
};

export const StandardMode: Story = {
  args: {
    isWeeklyPlanMode: false,
    weeklyPlan: null,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Chat IA/i }));
    await expect(args.onOpenWorkoutChat).toHaveBeenCalled();
  },
};

export const Empty: Story = {
  args: {
    isWeeklyPlanMode: false,
    weeklyPlan: null,
    workoutItems: [],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Adicionar Dia/i }),
    );
    await expect(args.onCreateWorkout).toHaveBeenCalled();
  },
};
