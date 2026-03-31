import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { gymStudentFixture } from "./gym-student-detail-story-fixtures";
import { WorkoutsTab } from "./workouts-tab";

const meta = {
  title: "Organisms/Gym/StudentDetail/WorkoutsTab",
  component: WorkoutsTab,
  args: {
    student: {
      ...gymStudentFixture,
      workoutHistory: [
        {
          workoutId: "history-1",
          date: new Date("2026-03-24T12:00:00.000Z"),
          workoutName: "Upper A",
          duration: 52,
          totalVolume: 4820,
          overallFeedback: "bom",
          exercises: [],
          bodyPartsFatigued: [],
        },
      ],
    },
    weeklyPlan: {
      id: "weekly-plan-1",
      title: "Plano de Hipertrofia A/B",
      description: "Divisao superior e inferior com cardio leve",
      slots: [
        {
          id: "slot-1",
          dayOfWeek: 0,
          type: "workout",
          locked: false,
          completed: false,
          workout: {
            id: "workout-1",
            title: "Upper A",
            description: "Peito, ombro e triceps",
            type: "strength",
            muscleGroup: "upper",
            difficulty: "intermediario",
            estimatedDuration: 55,
            exercises: [
              {
                id: "exercise-1",
                name: "Supino Reto",
                sets: 4,
                reps: "8-10",
                rest: 90,
              },
            ],
          } as never,
        },
        {
          id: "slot-2",
          dayOfWeek: 1,
          type: "rest",
          locked: false,
          completed: false,
        },
      ],
    },
    isLoadingWeeklyPlan: false,
    onReloadWeeklyPlan: async () => undefined,
    onCreateWeeklyPlan: async () => undefined,
  },
} satisfies Meta<typeof WorkoutsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyPlan: Story = {
  args: {
    weeklyPlan: null,
    student: {
      ...gymStudentFixture,
      workoutHistory: [],
    },
  },
};
