"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { db } from "@/lib/db";
import type { UserProgress } from "@/lib/types";
import {
  mockUserProgress,
  mockWorkoutHistory,
  mockPersonalRecords,
  mockWeightHistory,
} from "@/lib/mock-data";

export async function getStudentProfileData() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return {
        progress: mockUserProgress,
        workoutHistory: mockWorkoutHistory.slice(0, 3),
        personalRecords: mockPersonalRecords,
        weightHistory: mockWeightHistory,
      };
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return {
        progress: mockUserProgress,
        workoutHistory: mockWorkoutHistory.slice(0, 3),
        personalRecords: mockPersonalRecords,
        weightHistory: mockWeightHistory,
      };
    }

    const progress = await db.studentProgress.findUnique({
      where: { studentId: session.user.student.id },
    });

    const userProgress: UserProgress = progress
      ? {
          currentStreak: progress.currentStreak || 0,
          longestStreak: progress.longestStreak || 0,
          totalXP: progress.totalXP || 0,
          currentLevel: progress.currentLevel || 1,
          xpToNextLevel: progress.xpToNextLevel || 0,
          workoutsCompleted: progress.workoutsCompleted || 0,
          todayXP: progress.todayXP || 0,
          achievements: [],
          lastActivityDate: new Date().toISOString(),
          dailyGoalXP: 50,
          weeklyXP: [0, 0, 0, 0, 0, 0, 0],
        }
      : mockUserProgress;

    return {
      progress: userProgress,
      workoutHistory: mockWorkoutHistory.slice(0, 3),
      personalRecords: mockPersonalRecords,
      weightHistory: mockWeightHistory,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
    return {
      progress: mockUserProgress,
      workoutHistory: mockWorkoutHistory.slice(0, 3),
      personalRecords: mockPersonalRecords,
      weightHistory: mockWeightHistory,
    };
  }
}
