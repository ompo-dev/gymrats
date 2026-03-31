import type { WeeklyPlanData } from "@/lib/types";
import type { PersonalStudentAssignmentForDetail } from "../hooks/use-personal-student-detail";

export const assignmentFixture: PersonalStudentAssignmentForDetail = {
  id: "assignment-1",
  student: {
    id: "student-1",
    avatar: "/placeholder.svg",
    user: {
      id: "user-1",
      name: "Ana Souza",
      email: "ana@gymrats.local",
    },
    profile: {
      height: 168,
      weight: 62,
      fitnessLevel: "intermediate",
      weeklyWorkoutFrequency: 5,
      goals: JSON.stringify(["ganho-de-massa", "mobilidade"]),
    },
    progress: {
      totalXP: 820,
      xpToNextLevel: 180,
      currentLevel: 7,
      weeklyXP: [20, 45, 30, 60, 55, 25, 40],
    },
    records: [
      {
        exerciseName: "Supino Reto",
        date: new Date("2026-03-12T12:00:00.000Z"),
        value: 65,
        type: "forca-maxima",
      },
      {
        exerciseName: "Agachamento Livre",
        date: new Date("2026-03-15T12:00:00.000Z"),
        value: 90,
        type: "forca-maxima",
      },
    ],
  },
  gym: {
    id: "gym-1",
    name: "GymRats Paulista",
  },
};

export const weeklyPlanFixture: WeeklyPlanData = {
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
};
