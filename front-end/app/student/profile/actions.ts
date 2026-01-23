"use server";

import { backendGet } from "@/lib/api/backend-client";
import {
  mockPersonalRecords,
  mockUserProgress,
  mockWeightHistory,
  mockWorkoutHistory,
} from "@/lib/mock-data";

type StudentAllData = {
  user?: {
    name?: string;
    username?: string;
    memberSince?: string;
  };
  profile?: {
    weight?: number | null;
    goals?: string[];
  };
  progress?: Record<string, unknown>;
  workoutHistory?: Array<{ date?: string | Date }>;
  personalRecords?: unknown[];
  weightHistory?: Array<{ date?: string | Date; weight: number }>;
  weightGain?: number;
};

function getFallback() {
  return {
    progress: mockUserProgress,
    workoutHistory: mockWorkoutHistory.slice(0, 3),
    personalRecords: mockPersonalRecords,
    weightHistory: mockWeightHistory,
    userInfo: null,
    weeklyWorkouts: 0,
    weightGain: null,
    ranking: null,
    currentWeight: null,
    hasWeightLossGoal: false,
  };
}

export async function getStudentProfileData() {
  try {
    const response = await backendGet<StudentAllData>(
      "/api/students/all?sections=user,profile,progress,workoutHistory,weightHistory,personalRecords"
    );

    if (!response) {
      return getFallback();
    }

    const workoutHistory = response.workoutHistory || [];
    const weightHistory = response.weightHistory || mockWeightHistory;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const weeklyWorkouts = workoutHistory.filter((entry) => {
      if (!entry?.date) {
        return false;
      }
      const date = new Date(entry.date);
      return date >= sevenDaysAgo;
    }).length;

    const hasWeightLossGoal =
      Array.isArray(response.profile?.goals) &&
      response.profile?.goals.includes("perder-peso");

    const currentWeight =
      weightHistory.length > 0
        ? weightHistory[0].weight
        : response.profile?.weight ?? null;

    return {
      progress: response.progress || mockUserProgress,
      workoutHistory: workoutHistory.slice(0, 3),
      personalRecords: response.personalRecords || mockPersonalRecords,
      weightHistory,
      userInfo: response.user
        ? {
            name: response.user.name || "Usuário",
            username: response.user.username || "@usuario",
            memberSince: response.user.memberSince || "Jan 2025",
          }
        : null,
      weeklyWorkouts,
      weightGain: response.weightGain ?? null,
      ranking: null,
      currentWeight,
      hasWeightLossGoal,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
    return getFallback();
  }
}
