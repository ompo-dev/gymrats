import { db } from "@/lib/db";
import type { StudentProfileData } from "@/lib/types/student-unified";
import { parseJsonArray } from "@/lib/utils/json";

function serializeStringArray(value: string[] | undefined): string | null {
  return value && value.length > 0 ? JSON.stringify(value) : null;
}

export const StudentProfileService = {
  async getProfile(studentId: string) {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { profile: true },
    });

    if (!student?.profile) return null;

    const profile = student.profile;
    return {
      ...profile,
      goals: parseJsonArray<string>(profile.goals),
      hasWeightLossGoal: profile.goals
        ? profile.goals.includes("perder-peso")
        : false,
    };
  },

  async getWeightHistory(studentId: string) {
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
      weightGain,
    };
  },

  async getDailyNutrition(studentId: string) {
    const dateStr = new Date().toISOString().split("T")[0];
    const daily = await db.dailyNutrition.findFirst({
      where: { studentId, date: { gte: new Date(dateStr) } },
      include: { meals: { include: { foods: true } } },
    });

    return daily
      ? {
          totalCalories: daily.meals.reduce(
            (sum, meal) => sum + meal.calories,
            0,
          ),
          waterIntake: daily.waterIntake,
        }
      : null;
  },

  async saveOnboardingData(
    studentId: string,
    data: Partial<StudentProfileData>,
  ) {
    const profileData = {
      studentId,
      height: data.height ?? null,
      weight: data.weight ?? null,
      fitnessLevel: data.fitnessLevel ?? null,
      weeklyWorkoutFrequency: data.weeklyWorkoutFrequency ?? null,
      workoutDuration: data.workoutDuration ?? null,
      goals: serializeStringArray(data.goals),
      gymType: data.gymType ?? null,
      preferredSets: data.preferredSets ?? null,
      preferredRepRange: data.preferredRepRange ?? null,
      restTime: data.restTime ?? null,
      targetCalories: data.targetCalories ?? null,
      targetProtein: data.targetProtein ?? null,
      targetCarbs: data.targetCarbs ?? null,
      targetFats: data.targetFats ?? null,
      activityLevel: data.activityLevel ?? null,
      physicalLimitations: serializeStringArray(data.physicalLimitations),
      motorLimitations: serializeStringArray(data.motorLimitations),
      medicalConditions: serializeStringArray(data.medicalConditions),
    };

    return db.studentProfile.upsert({
      where: { studentId },
      create: profileData,
      update: profileData,
    });
  },
};
