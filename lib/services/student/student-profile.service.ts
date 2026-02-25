import { db } from "@/lib/db";

export class StudentProfileService {
  /**
   * Busca dados do perfil do aluno
   */
  static async getProfile(studentId: string) {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    if (!student?.profile) return null;

    const p = student.profile;
    return {
      ...p,
      goals: p.goals ? JSON.parse(p.goals) : [],
      hasWeightLossGoal: p.goals ? p.goals.includes("perder-peso") : false,
    };
  }

  /**
   * Busca histórico de peso e ganho/perda mensal
   */
  static async getWeightHistory(studentId: string) {
    const data = await db.weightHistory.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 30,
    });

    let weightGain = 0;
    if (data.length > 0) {
      const currentWeight = data[0].weight;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const weightOneMonthAgo = await db.weightHistory.findFirst({
        where: { studentId, date: { lte: oneMonthAgo } },
        orderBy: { date: "desc" },
      });
      if (weightOneMonthAgo) {
        weightGain = currentWeight - weightOneMonthAgo.weight;
      }
    }

    return {
      history: data,
      weightGain
    };
  }

  /**
   * Busca nutrição diária e metas
   */
  static async getDailyNutrition(studentId: string) {
    const dateStr = new Date().toISOString().split("T")[0];
    const daily = await db.dailyNutrition.findFirst({
      where: { studentId, date: { gte: new Date(dateStr) } },
      include: { meals: { include: { foods: true } } }
    });

    return daily ? {
      totalCalories: daily.meals.reduce((sum, m) => sum + m.calories, 0),
      waterIntake: daily.waterIntake,
    } : null;
  }

  /**
   * Salva dados de onboarding do aluno
   */
  static async saveOnboardingData(studentId: string, data: any) {
    const profileData = {
      studentId,
      height: data.height || null,
      weight: data.weight || null,
      fitnessLevel: data.fitnessLevel || null,
      weeklyWorkoutFrequency: data.weeklyWorkoutFrequency || null,
      workoutDuration: data.workoutDuration || null,
      goals: data.goals?.length ? JSON.stringify(data.goals) : null,
      gymType: data.gymType || null,
      preferredSets: data.preferredSets ?? null,
      preferredRepRange: data.preferredRepRange || null,
      restTime: data.restTime || null,
      targetCalories: data.targetCalories || null,
      targetProtein: data.targetProtein || null,
      targetCarbs: data.targetCarbs || null,
      targetFats: data.targetFats || null,
      activityLevel: data.activityLevel || null,
      physicalLimitations: data.physicalLimitations?.length ? JSON.stringify(data.physicalLimitations) : null,
      motorLimitations: data.motorLimitations?.length ? JSON.stringify(data.motorLimitations) : null,
      medicalConditions: data.medicalConditions?.length ? JSON.stringify(data.medicalConditions) : null,
    };

    return db.studentProfile.upsert({
      where: { studentId },
      create: profileData,
      update: profileData,
    });
  }
}
