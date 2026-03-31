"use client";

import { DuoCard } from "@/components/duo";
import type { DailyNutrition, Unit, WorkoutHistory } from "@/lib/types";
import type { StudentHomeScreenProps } from "./student-home.screen";

export function createStudentHomeFixture(
  overrides: Partial<StudentHomeScreenProps> = {},
): StudentHomeScreenProps {
  const workoutHistory = [
    {
      id: "history-1",
      workoutName: "Peito e Tríceps",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      duration: 52,
      totalVolume: 6840,
      overallFeedback: "bom",
    },
  ] as unknown as WorkoutHistory[];

  const units = [
    {
      id: "unit-1",
      title: "Fase 1",
      description: "",
      color: "#58CC02",
      icon: "💪",
      workouts: [
        {
          id: "workout-1",
          title: "Treino A",
          completed: false,
          locked: false,
        },
      ],
    },
  ] as Unit[];

  return {
    userName: "Camila Rocha",
    displayProgress: {
      currentStreak: 7,
      longestStreak: 18,
      totalXP: 1340,
      todayXP: 120,
      currentLevel: 8,
      xpToNextLevel: 60,
      workoutsCompleted: 58,
    },
    showLevelProgress: true,
    workoutHistory,
    units,
    dailyNutrition: {
      date: new Date().toISOString(),
      meals: [],
      waterIntake: 0,
      targetWater: 3000,
      totalCalories: 0,
      targetCalories: 2200,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      calorieGoalMet: false,
      waterGoalMet: false,
      mealsCompleted: 0,
    } as unknown as DailyNutrition,
    currentWeight: 78.4,
    weightGain: 0.6,
    hasWeightLossGoal: false,
    weightHistory: [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        weight: 77.8,
      },
      {
        date: new Date(),
        weight: 78.4,
      },
    ],
    campaignsSlot: (
      <DuoCard.Root variant="default" padding="md">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-duo-green">
            Sponsored Preview
          </p>
          <h3 className="text-xl font-bold text-duo-text">
            Campanhas patrocinadas aparecem aqui
          </h3>
          <p className="text-sm text-duo-fg-muted">
            No app real, esse slot recebe o carrossel de ofertas por geolocalização.
          </p>
        </div>
      </DuoCard.Root>
    ),
    ...overrides,
  };
}
