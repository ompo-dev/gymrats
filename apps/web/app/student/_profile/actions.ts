import type { BootstrapResponse } from "@gymrats/types/bootstrap";
import { getStudentBootstrapAction } from "@/lib/actions/web-actions";
import type { UserProgress } from "@/lib/types";

export async function getStudentProfileData() {
  try {
    const response = (await getStudentBootstrapAction([
      "user",
      "progress",
      "profile",
      "workoutHistory",
      "personalRecords",
      "weightHistory",
    ])) as BootstrapResponse<Record<string, unknown>>;
    const payload = response.data;

    const user = payload.user as
      | {
          name?: string | null;
          email?: string | null;
          createdAt?: string | Date;
        }
      | undefined;
    const workoutHistory = Array.isArray(payload.workoutHistory)
      ? payload.workoutHistory
      : [];
    const weightHistory = Array.isArray(payload.weightHistory)
      ? payload.weightHistory
      : [];
    const progress =
      (payload.progress as UserProgress | undefined) ??
      getNeutralUserProgress();
    const profile =
      (payload.profile as {
        weight?: number | null;
        hasWeightLossGoal?: boolean;
      } | null) ?? null;

    return {
      progress,
      workoutHistory,
      personalRecords: Array.isArray(payload.personalRecords)
        ? payload.personalRecords
        : [],
      weightHistory,
      userInfo: user?.email
        ? {
            name: user.name || "Usuario",
            username: `@${user.email.split("@")[0].toLowerCase()}`,
            memberSince: user.createdAt
              ? new Intl.DateTimeFormat("pt-BR", {
                  month: "short",
                  year: "numeric",
                }).format(new Date(user.createdAt))
              : "",
          }
        : null,
      currentWeight: profile?.weight || null,
      weightGain:
        typeof payload.weightGain === "number" ? payload.weightGain : null,
      weeklyWorkouts: workoutHistory.length,
      ranking: null,
      hasWeightLossGoal: profile?.hasWeightLossGoal || false,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
    return getNeutralProfileData();
  }
}

function getNeutralUserProgress(): UserProgress {
  return {
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
  };
}

function getNeutralProfileData() {
  return {
    progress: getNeutralUserProgress(),
    workoutHistory: [],
    personalRecords: [],
    weightHistory: [],
    userInfo: null,
    weeklyWorkouts: 0,
    weightGain: null,
    ranking: null,
    currentWeight: null,
    hasWeightLossGoal: false,
  };
}
