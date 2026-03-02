/**
 * Server Actions Unificadas para Student
 *
 * Esta função agora delega a lógica para o StudentDomainService,
 * centralizando as queries e facilitando a manutenção.
 */

"use server";

import { StudentDomainService } from "@/lib/services/student-domain.service";
import { getStudentContext } from "@/lib/utils/student/student-context";

/**
 * HELPER: Obter Student ID e User ID da sessão atual
 */
async function getStudentId(): Promise<{
  studentId: string | null;
  userId: string | null;
}> {
  try {
    const { ctx, error } = await getStudentContext();

    if (error || !ctx) return { studentId: null, userId: null };

    return {
      studentId: ctx.studentId,
      userId: ctx.user.id,
    };
  } catch (error) {
    console.error("[getStudentId] Erro:", error);
    return { studentId: null, userId: null };
  }
}

/**
 * FUNÇÃO PRINCIPAL: Buscar Todos os Dados
 * Delega para o StudentDomainService.getAllData
 */
export async function getAllStudentData(sections?: string[]) {
  try {
    const { studentId, userId } = await getStudentId();

    if (!studentId || !userId) {
      return getNeutralData();
    }

    return StudentDomainService.getAllData(studentId, userId, sections);
  } catch (error) {
    console.error("[getAllStudentData] Erro:", error);
    return getNeutralData();
  }
}

/**
 * HELPER: Dados neutros para fallback
 */
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
