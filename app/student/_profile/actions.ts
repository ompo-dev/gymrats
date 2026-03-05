import type { UserProgress } from "@/lib/types";
import { StudentProfileService } from "@/lib/services/student/student-profile.service";
import { StudentProgressService } from "@/lib/services/student/student-progress.service";
import { StudentWorkoutService } from "@/lib/services/student/student-workout.service";
import { getStudentContext } from "@/lib/utils/student/student-context";

export async function getStudentProfileData() {
  try {
    const { ctx, error } = await getStudentContext();
    if (error || !ctx) return getNeutralProfileData();

    const studentId = ctx.studentId!;

    const [profile, progress, workoutHistory, personalRecords, weightData] =
      await Promise.all([
        StudentProfileService.getProfile(studentId),
        StudentProgressService.getProgress(studentId),
        StudentWorkoutService.getWorkoutHistory(studentId, 3),
        StudentWorkoutService.getPersonalRecords(studentId),
        StudentProfileService.getWeightHistory(studentId),
      ]);

    const ranking = await StudentProgressService.getRanking(
      studentId,
      progress.totalXP,
    );

    return {
      progress,
      workoutHistory,
      personalRecords,
      weightHistory: weightData.history,
      userInfo: {
        name: ctx.user.name || "Usuário",
        username: `@${ctx.user.email.split("@")[0].toLowerCase()}`,
        memberSince: new Intl.DateTimeFormat("pt-BR", {
          month: "short",
          year: "numeric",
        }).format(ctx.user.createdAt),
      },
      currentWeight: profile?.weight || null,
      weightGain: weightData.weightGain,
      weeklyWorkouts: workoutHistory.length, // Simplificado
      ranking: ranking,
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
