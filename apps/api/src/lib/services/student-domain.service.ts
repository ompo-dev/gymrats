import { BaseStudentDomainService } from "@gymrats/domain/services/student/student-domain.service";
import { db } from "@/lib/db";
import {
  getActiveNutritionPlan as getActiveNutritionPlanForStudent,
  getDailyNutritionForStudent,
  listNutritionLibraryPlans,
} from "@/lib/services/nutrition/nutrition-plan.service";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import { parseJsonArray } from "@/lib/utils/json";

function calculateStreakFromWorkoutDates(dates: Date[]) {
  const workoutDays = new Set<string>();
  dates.forEach((dateValue) => {
    const dateOnly = new Date(dateValue);
    dateOnly.setHours(0, 0, 0, 0);
    workoutDays.add(dateOnly.toISOString().split("T")[0]);
  });

  let currentStreak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  const todayStr = checkDate.toISOString().split("T")[0];
  const yesterday = new Date(checkDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (!workoutDays.has(todayStr) && !workoutDays.has(yesterdayStr)) {
    return 0;
  }

  if (!workoutDays.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (!workoutDays.has(dateStr)) {
      break;
    }

    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return currentStreak;
}

export class StudentDomainService extends BaseStudentDomainService {
  static override async calculateStreak(studentId: string) {
    const allWorkoutHistory = await db.workoutHistory.findMany({
      where: { studentId },
      select: { date: true },
    });

    return calculateStreakFromWorkoutDates(
      allWorkoutHistory.map((workoutHistory) => workoutHistory.date),
    );
  }

  static override async getProgress(studentId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [progress, streakHistory, achievementUnlocks, workoutHistoryForXP] =
      await Promise.all([
        db.studentProgress.findUnique({
          where: { studentId },
        }),
        db.workoutHistory.findMany({
          where: { studentId },
          select: { date: true },
        }),
        db.achievementUnlock.findMany({
          where: { studentId },
          select: {
            unlockedAt: true,
            progress: true,
            achievement: {
              select: {
                id: true,
                title: true,
                description: true,
                icon: true,
                target: true,
                category: true,
                level: true,
                color: true,
              },
            },
          },
          orderBy: { unlockedAt: "desc" },
        }),
        db.workoutHistory.findMany({
          where: {
            studentId,
            date: { gte: sevenDaysAgo },
          },
          select: {
            date: true,
            workout: { select: { xpReward: true } },
          },
        }),
      ]);

    const calculatedStreak = calculateStreakFromWorkoutDates(
      streakHistory.map((workoutHistory) => workoutHistory.date),
    );

    const achievements = achievementUnlocks.map((unlock) => ({
      id: unlock.achievement.id,
      title: unlock.achievement.title,
      description: unlock.achievement.description || "",
      icon: unlock.achievement.icon || "??",
      unlockedAt: unlock.unlockedAt,
      progress: unlock.progress || undefined,
      target: unlock.achievement.target || undefined,
      category: unlock.achievement.category,
      level: unlock.achievement.level || undefined,
      color: unlock.achievement.color || "#58CC02",
    }));

    const weeklyXP = [0, 0, 0, 0, 0, 0, 0];
    workoutHistoryForXP.forEach((wh) => {
      const dayOfWeek = wh.date.getDay();
      if (wh.workout) {
        weeklyXP[dayOfWeek] += wh.workout.xpReward || 0;
      }
    });

    return {
      currentStreak: calculatedStreak,
      longestStreak: progress
        ? Math.max(calculatedStreak, progress.longestStreak || 0)
        : 0,
      totalXP: progress?.totalXP || 0,
      currentLevel: progress?.currentLevel || 1,
      xpToNextLevel: progress?.xpToNextLevel || 100,
      workoutsCompleted: progress?.workoutsCompleted || 0,
      todayXP: progress?.todayXP || 0,
      achievements,
      lastActivityDate:
        progress?.lastActivityDate?.toISOString() || new Date().toISOString(),
      dailyGoalXP: progress?.dailyGoalXP || 50,
      weeklyXP,
    };
  }

  static override async getAllData(
    studentId: string,
    userId: string,
    sections?: string[],
  ): Promise<Record<string, unknown>> {
    const requestedSections = sections
      ? sections.filter(
          (section) => section !== "actions" && section !== "loaders",
        )
      : null;
    const result: Record<string, unknown> = {};

    if (!requestedSections || requestedSections.includes("user")) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
      });
      if (user) {
        result.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          username: `@${user.email.split("@")[0].toLowerCase()}`,
          memberSince: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric",
              })
            : "Jan 2025",
          avatar: user.image || undefined,
          role: user.role || "STUDENT",
          isAdmin: user.role === "ADMIN",
        };
      }
    }

    if (!requestedSections || requestedSections.includes("student")) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          age: true,
          gender: true,
          phone: true,
          avatar: true,
        },
      });
      if (student) {
        result.student = student;
      }
    }

    if (!requestedSections || requestedSections.includes("progress")) {
      result.progress = await StudentDomainService.getProgress(studentId);
    }

    if (!requestedSections || requestedSections.includes("profile")) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { profile: true },
      });
      if (student?.profile) {
        const profile = student.profile;
        result.profile = {
          ...profile,
          goals: parseJsonArray<string>(profile.goals),
          injuries: parseJsonArray<string>(profile.injuries),
          availableEquipment: parseJsonArray<string>(
            profile.availableEquipment,
          ),
          allergies: parseJsonArray<string>(profile.allergies),
          hasWeightLossGoal: profile.goals
            ? profile.goals.includes("perder-peso")
            : false,
        };
      }
    }

    if (!requestedSections || requestedSections.includes("units")) {
      result.units =
        await BaseStudentDomainService.getUnitsWithWorkouts(studentId);
    }

    if (!requestedSections || requestedSections.includes("subscription")) {
      result.subscription =
        await BaseStudentDomainService.getSubscription(studentId);
    }

    if (!requestedSections || requestedSections.includes("dailyNutrition")) {
      result.dailyNutrition =
        await StudentDomainService.getDailyNutrition(studentId);
    }

    if (
      !requestedSections ||
      requestedSections.includes("activeNutritionPlan")
    ) {
      result.activeNutritionPlan =
        await StudentDomainService.getActiveNutritionPlan(studentId);
    }

    if (
      !requestedSections ||
      requestedSections.includes("nutritionLibraryPlans")
    ) {
      result.nutritionLibraryPlans =
        await StudentDomainService.getNutritionLibraryPlans(studentId);
    }

    if (!requestedSections || requestedSections.includes("workoutHistory")) {
      result.workoutHistory =
        await BaseStudentDomainService.getWorkoutHistory(studentId);
    }

    if (!requestedSections || requestedSections.includes("personalRecords")) {
      result.personalRecords =
        await BaseStudentDomainService.getPersonalRecords(studentId);
    }

    if (!requestedSections || requestedSections.includes("weightHistory")) {
      const weightHistorySnapshot =
        await BaseStudentDomainService.getWeightHistory(studentId);
      result.weightHistory = weightHistorySnapshot.history;
      result.weightGain = weightHistorySnapshot.weightGain;
    }

    if (!requestedSections || requestedSections.includes("memberships")) {
      result.memberships =
        await BaseStudentDomainService.getMemberships(studentId);
    }

    if (!requestedSections || requestedSections.includes("payments")) {
      result.payments = await BaseStudentDomainService.getPayments(studentId);
    }

    if (!requestedSections || requestedSections.includes("paymentMethods")) {
      result.paymentMethods =
        await BaseStudentDomainService.getPaymentMethods(userId);
    }

    if (!requestedSections || requestedSections.includes("dayPasses")) {
      result.dayPasses = await BaseStudentDomainService.getDayPasses(studentId);
    }

    if (!requestedSections || requestedSections.includes("gymLocations")) {
      result.gymLocations = await BaseStudentDomainService.getGymLocations();
    }

    if (!requestedSections || requestedSections.includes("friends")) {
      result.friends = await BaseStudentDomainService.getFriends(studentId);
    }

    if (!requestedSections || requestedSections.includes("foodDatabase")) {
      result.foodDatabase = [];
    }

    return result;
  }

  static override async getDailyNutrition(studentId: string) {
    return getDailyNutritionForStudent(studentId, getBrazilNutritionDateKey());
  }

  static async getActiveNutritionPlan(studentId: string) {
    return getActiveNutritionPlanForStudent(studentId);
  }

  static async getNutritionLibraryPlans(studentId: string) {
    return listNutritionLibraryPlans(studentId);
  }
}
