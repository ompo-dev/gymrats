import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { RecentWorkoutsCard } from "@/components/organisms/home/home/recent-workouts-card";

type RecentWorkoutsProps = Parameters<typeof RecentWorkoutsCard.Simple>[0];

const workoutHistory = [
  {
    date: new Date("2026-03-26T09:00:00Z"),
    workoutId: "wk-1",
    workoutName: "Pull day",
    duration: 52,
    totalVolume: 7800,
    exercises: [],
    overallFeedback: "excelente",
    bodyPartsFatigued: ["costas"],
  },
  {
    date: new Date("2026-03-25T09:00:00Z"),
    workoutId: "wk-2",
    workoutName: "Leg day",
    duration: 61,
    totalVolume: 9100,
    exercises: [],
    overallFeedback: "bom",
    bodyPartsFatigued: ["pernas"],
  },
  {
    date: new Date("2026-03-23T09:00:00Z"),
    workoutId: "wk-3",
    workoutName: "Push day",
    duration: 49,
    totalVolume: 6900,
    exercises: [],
    overallFeedback: "regular",
    bodyPartsFatigued: ["peito"],
  },
] as RecentWorkoutsProps["workoutHistory"];

const meta = {
  title: "Organisms/Home/RecentWorkoutsCard",
  component: RecentWorkoutsCard.Simple,
  tags: ["autodocs"],
} satisfies Meta<typeof RecentWorkoutsCard.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithHistory: Story = {
  args: {
    workoutHistory,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Pull day/i)).toBeVisible();
    await expect(canvas.getByText(/7800 kg/i)).toBeVisible();
  },
};

export const EmptyState: Story = {
  args: {
    workoutHistory: [],
  },
};
