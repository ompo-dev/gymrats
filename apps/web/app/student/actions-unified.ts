"use server";

import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import { serverApiGet } from "@/lib/api/server";
import { buildApiPath } from "@/lib/api/server-action-utils";

export async function getAllStudentData(sections?: string[]) {
  try {
    const path = buildApiPath("/api/students/bootstrap", {
      sections: sections?.length ? sections.join(",") : undefined,
    });

    const response =
      await serverApiGet<BootstrapResponse<Record<string, unknown>>>(path);
    return response.data;
  } catch (error) {
    console.error("[getAllStudentData] Erro:", error);
    return getNeutralData();
  }
}

function getNeutralData() {
  return {
    user: null,
    student: null,
    progress: {
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      currentLevel: 1,
      xpToNextLevel: 100,
      workoutsCompleted: 0,
      todayXP: 0,
      achievements: [],
      lastActivityDate: new Date().toISOString(),
      dailyGoalXP: 50,
      weeklyXP: [0, 0, 0, 0, 0, 0, 0],
    },
    profile: null,
    weightHistory: [],
    weightGain: null,
    units: [],
    workoutHistory: [],
    personalRecords: [],
    dailyNutrition: {
      date: new Date().toISOString().split("T")[0],
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      waterIntake: 0,
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFats: 65,
      targetWater: 2000,
    },
    foodDatabase: [],
    subscription: null,
    memberships: [],
    payments: [],
    paymentMethods: [],
    dayPasses: [],
    gymLocations: [],
    friends: {
      count: 0,
      list: [],
    },
  };
}
