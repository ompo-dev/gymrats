import { db } from "@/lib/db";
import { getBrazilNutritionDateKey } from "@/lib/utils/brazil-nutrition-date";
import {
  getActiveNutritionPlan as getActiveNutritionPlanForStudent,
  getDailyNutritionForStudent,
  listNutritionLibraryPlans,
} from "@/lib/services/nutrition/nutrition-plan.service";

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

type ScalarUpdateValue = string | number | boolean | null | undefined;

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toNullableNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  return toOptionalNumber(value);
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  return toOptionalString(value);
}

function toNullableBoolean(value: unknown): boolean | null | undefined {
  if (value === null) {
    return null;
  }
  return typeof value === "boolean" ? value : undefined;
}

function toDateValue(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function toJSONString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return JSON.stringify(value);
}

/**
 * Service to centralize student domain operations and stat updates
 */
export class StudentDomainService {
  /**
   * Calculates current and longest streak based on workout history
   */
  static async calculateStreak(studentId: string) {
    const allWorkoutHistory = await db.workoutHistory.findMany({
      where: { studentId },
      select: { date: true },
    });
    return calculateStreakFromWorkoutDates(
      allWorkoutHistory.map((workoutHistory) => workoutHistory.date),
    );
  }

  /**
   * Adds XP and handles leveling logic
   */
  static async addXP(studentId: string, amount: number) {
    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    });

    if (!progress) {
      return db.studentProgress.create({
        data: {
          studentId,
          totalXP: amount,
          todayXP: amount,
          currentLevel: 1,
          xpToNextLevel: 100,
        },
      });
    }

    const newTotalXP = (progress.totalXP || 0) + amount;
    const newTodayXP = (progress.todayXP || 0) + amount;
    let newLevel = progress.currentLevel || 1;
    let newXPToNextLevel = progress.xpToNextLevel || 100;

    // Basic leveling logic: exponentially increasing XP required
    // Level 1: 100, Level 2: 250, Level 3: 450...
    while (newTotalXP >= newXPToNextLevel) {
      newLevel++;
      newXPToNextLevel += newLevel * 100 + 50;
    }

    return db.studentProgress.update({
      where: { studentId },
      data: {
        totalXP: newTotalXP,
        todayXP: newTodayXP,
        currentLevel: newLevel,
        xpToNextLevel: newXPToNextLevel,
        lastActivityDate: new Date(),
      },
    });
  }

  /**
   * Gets detailed student progress including achievements and weekly XP
   */
  static async getProgress(studentId: string) {
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

    if (progress && calculatedStreak !== (progress.currentStreak || 0)) {
      void db.studentProgress
        .update({
          where: { studentId },
          data: {
            currentStreak: calculatedStreak,
            longestStreak: Math.max(
              calculatedStreak,
              progress.longestStreak || 0,
            ),
          },
        })
        .catch(() => undefined);
    }

    const achievements = achievementUnlocks.map((unlock) => ({
      id: unlock.achievement.id,
      title: unlock.achievement.title,
      description: unlock.achievement.description || "",
      icon: unlock.achievement.icon || "🏆",
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

  /**
   * Updates student progress data
   */
  static async updateProgress(
    studentId: string,
    data: Record<string, unknown>,
  ) {
    const progressData = {
      totalXP: toOptionalNumber(data.totalXP),
      todayXP: toOptionalNumber(data.todayXP),
      workoutsCompleted: toOptionalNumber(data.workoutsCompleted),
      currentStreak: toOptionalNumber(data.currentStreak),
      longestStreak: toOptionalNumber(data.longestStreak),
      currentLevel: toOptionalNumber(data.currentLevel),
      xpToNextLevel: toOptionalNumber(data.xpToNextLevel),
      dailyGoalXP: toOptionalNumber(data.dailyGoalXP),
      lastActivityDate: toDateValue(data.lastActivityDate),
    };

    return db.studentProgress.upsert({
      where: { studentId },
      create: {
        studentId,
        ...progressData,
      },
      update: progressData,
    });
  }

  /**
   * Upserts student profile data
   */
  static async upsertProfile(
    studentId: string,
    data: Record<string, ScalarUpdateValue>,
  ) {
    return db.studentProfile.upsert({
      where: { studentId },
      create: { studentId, ...data },
      update: data,
    });
  }

  /**
   * Updates full student profile including core student data and profile details
   */
  static async updateFullProfile(
    studentId: string,
    data: Record<string, unknown>,
  ) {
    // 1. Update basic student information
    await db.student.update({
      where: { id: studentId },
      data: {
        age: toNullableNumber(data.age),
        gender: toNullableString(data.gender),
        isTrans: toNullableBoolean(data.isTrans),
        usesHormones: toNullableBoolean(data.usesHormones),
        hormoneType: toNullableString(data.hormoneType),
      },
    });

    // 2. Prepare profile data (handling JSON stringification for arrays/objects)
    const profileData: Record<string, ScalarUpdateValue> = {
      height: toNullableNumber(data.height),
      weight: toNullableNumber(data.weight),
      fitnessLevel: toNullableString(data.fitnessLevel),
      weeklyWorkoutFrequency: toNullableNumber(data.weeklyWorkoutFrequency),
      workoutDuration: toNullableNumber(data.workoutDuration),
      goals: toJSONString(data.goals),
      injuries: toJSONString(data.injuries),
      availableEquipment: toJSONString(data.availableEquipment),
      gymType: toNullableString(data.gymType),
      preferredWorkoutTime: toNullableString(data.preferredWorkoutTime),
      preferredSets: toNullableNumber(data.preferredSets),
      preferredRepRange: toNullableString(data.preferredRepRange),
      restTime: toNullableString(data.restTime),
      dietType: toNullableString(data.dietType),
      allergies: toJSONString(data.allergies),
      targetCalories: toNullableNumber(data.targetCalories),
      targetProtein: toNullableNumber(data.targetProtein),
      targetCarbs: toNullableNumber(data.targetCarbs),
      targetFats: toNullableNumber(data.targetFats),
      targetWater: toNullableNumber(data.targetWater),
      mealsPerDay: toNullableNumber(data.mealsPerDay),
      bmr: toNullableNumber(data.bmr),
      tdee: toNullableNumber(data.tdee),
      activityLevel: toNullableNumber(data.activityLevel),
      hormoneTreatmentDuration: toNullableNumber(data.hormoneTreatmentDuration),
      physicalLimitations: toJSONString(data.physicalLimitations),
      motorLimitations: toJSONString(data.motorLimitations),
      medicalConditions: toJSONString(data.medicalConditions),
      limitationDetails: toJSONString(data.limitationDetails),
      dailyAvailableHours: toNullableNumber(data.dailyAvailableHours),
    };

    await StudentDomainService.upsertProfile(studentId, profileData);

    // 3. Ensure progress exists
    await db.studentProgress.upsert({
      where: { studentId },
      create: { studentId },
      update: {},
    });

    return { success: true };
  }

  /**
   * Aggregate method to fetch all student data (replacement for getAllStudentData)
   */
  static async getAllData(
    studentId: string,
    userId: string,
    sections?: string[],
  ): Promise<Record<string, unknown>> {
    const requestedSections = sections
      ? sections.filter((s) => s !== "actions" && s !== "loaders")
      : null;

    const result: Record<string, unknown> = {};

    // 1. User Info
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

    // 2. Student Info
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
      if (student) result.student = student;
    }

    // 3. Progress (Delegated to specialized method)
    if (!requestedSections || requestedSections.includes("progress")) {
      result.progress = await StudentDomainService.getProgress(studentId);
    }

    // 4. Profile
    if (!requestedSections || requestedSections.includes("profile")) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { profile: true },
      });
      if (student?.profile) {
        const p = student.profile;
        result.profile = {
          ...p,
          goals: p.goals ? JSON.parse(p.goals) : [],
          injuries: p.injuries ? JSON.parse(p.injuries) : [],
          availableEquipment: p.availableEquipment
            ? JSON.parse(p.availableEquipment)
            : [],
          allergies: p.allergies ? JSON.parse(p.allergies) : [],
          hasWeightLossGoal: p.goals ? p.goals.includes("perder-peso") : false,
        };
      }
    }

    // 5. Units & Workouts
    if (!requestedSections || requestedSections.includes("units")) {
      result.units = await StudentDomainService.getUnitsWithWorkouts(studentId);
    }

    // 6. Subscription
    if (!requestedSections || requestedSections.includes("subscription")) {
      result.subscription =
        await StudentDomainService.getSubscription(studentId);
    }

    // 7. Others (Nutrition, History, etc.)
    if (!requestedSections || requestedSections.includes("dailyNutrition")) {
      result.dailyNutrition =
        await StudentDomainService.getDailyNutrition(studentId);
    }

    if (!requestedSections || requestedSections.includes("activeNutritionPlan")) {
      result.activeNutritionPlan =
        await StudentDomainService.getActiveNutritionPlan(studentId);
    }

    if (!requestedSections || requestedSections.includes("nutritionLibraryPlans")) {
      result.nutritionLibraryPlans =
        await StudentDomainService.getNutritionLibraryPlans(studentId);
    }

    if (!requestedSections || requestedSections.includes("workoutHistory")) {
      result.workoutHistory =
        await StudentDomainService.getWorkoutHistory(studentId);
    }

    if (!requestedSections || requestedSections.includes("personalRecords")) {
      result.personalRecords =
        await StudentDomainService.getPersonalRecords(studentId);
    }

    if (!requestedSections || requestedSections.includes("weightHistory")) {
      const weightHistorySnapshot =
        await StudentDomainService.getWeightHistory(studentId);
      result.weightHistory = weightHistorySnapshot.history;
      result.weightGain = weightHistorySnapshot.weightGain;
    }

    if (!requestedSections || requestedSections.includes("memberships")) {
      result.memberships = await StudentDomainService.getMemberships(studentId);
    }

    if (!requestedSections || requestedSections.includes("payments")) {
      result.payments = await StudentDomainService.getPayments(studentId);
    }

    if (!requestedSections || requestedSections.includes("paymentMethods")) {
      result.paymentMethods =
        await StudentDomainService.getPaymentMethods(userId);
    }

    if (!requestedSections || requestedSections.includes("dayPasses")) {
      result.dayPasses = await StudentDomainService.getDayPasses(studentId);
    }

    if (!requestedSections || requestedSections.includes("gymLocations")) {
      result.gymLocations = await StudentDomainService.getGymLocations();
    }

    if (!requestedSections || requestedSections.includes("friends")) {
      result.friends = await StudentDomainService.getFriends(studentId);
    }

    if (!requestedSections || requestedSections.includes("foodDatabase")) {
      result.foodDatabase = [];
    }

    return result;
  }

  private static async getUnitsWithWorkouts(studentId: string) {
    const units = await db.unit.findMany({
      orderBy: { order: "asc" },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
              include: { alternatives: { orderBy: { order: "asc" } } },
            },
            completions: {
              where: { studentId },
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const completedWorkoutIds = await db.workoutHistory.findMany({
      where: { studentId },
      select: { workoutId: true },
      distinct: ["workoutId"],
    });
    const completedIdsSet = new Set(
      completedWorkoutIds.map((wh) => wh.workoutId),
    );

    return units.map((unit, unitIndex) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description || "",
      color: unit.color || "#58CC02",
      icon: unit.icon || "💪",
      workouts: unit.workouts.map((workout, workoutIndex) => {
        const isCompleted = completedIdsSet.has(workout.id);
        const lastCompletion = workout.completions[0];

        // Complex locked logic from original action
        let isLocked = workout.locked;
        if (unitIndex === 0 && workoutIndex === 0) {
          isLocked = false;
        } else if (!isLocked) {
          if (unitIndex > 0 || workoutIndex > 0) {
            let previousWorkout = null;
            if (workoutIndex > 0) {
              previousWorkout = unit.workouts[workoutIndex - 1];
            } else if (unitIndex > 0) {
              const previousUnit = units[unitIndex - 1];
              if (previousUnit.workouts.length > 0) {
                previousWorkout =
                  previousUnit.workouts[previousUnit.workouts.length - 1];
              }
            }
            if (previousWorkout) {
              isLocked = !completedIdsSet.has(previousWorkout.id);
            }
          }
        }

        return {
          id: workout.id,
          title: workout.title,
          description: workout.description || "",
          type: workout.type,
          muscleGroup: workout.muscleGroup,
          difficulty: workout.difficulty,
          exercises: workout.exercises.map((ex) => ({
            ...ex,
            notes: ex.notes || undefined,
            videoUrl: ex.videoUrl || undefined,
            educationalId: ex.educationalId || undefined,
            alternatives:
              ex.alternatives.length > 0 ? ex.alternatives : undefined,
          })),
          xpReward: workout.xpReward,
          estimatedTime: workout.estimatedTime,
          locked: isLocked,
          completed: isCompleted,
          stars: lastCompletion
            ? lastCompletion.overallFeedback === "excelente"
              ? 3
              : lastCompletion.overallFeedback === "bom"
                ? 2
                : 1
            : 0,
          completedAt: lastCompletion?.date,
        };
      }),
    }));
  }

  private static async getSubscription(studentId: string) {
    const sub = await db.subscription.findUnique({ where: { studentId } });
    if (!sub) return null;
    const now = new Date();
    const trialEnd = sub.trialEnd ? new Date(sub.trialEnd) : null;
    const isTrial = trialEnd ? trialEnd > now : false;
    if (sub.status === "canceled" && !isTrial) return null;

    // billingPeriod calculation
    const periodStart = new Date(sub.currentPeriodStart);
    const periodEnd = new Date(sub.currentPeriodEnd);
    const daysDiff = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24),
    );
    const billingPeriod =
      daysDiff >= 330 && daysDiff <= 370 ? "annual" : "monthly";

    return {
      ...sub,
      isTrial,
      daysRemaining: trialEnd
        ? Math.max(
            0,
            Math.ceil(
              (trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24),
            ),
          )
        : null,
      billingPeriod,
    };
  }

  private static async getDailyNutrition(studentId: string) {
    return getDailyNutritionForStudent(studentId, getBrazilNutritionDateKey());
  }

  private static async getActiveNutritionPlan(studentId: string) {
    return getActiveNutritionPlanForStudent(studentId);
  }

  private static async getNutritionLibraryPlans(studentId: string) {
    return listNutritionLibraryPlans(studentId);
  }

  private static async getWorkoutHistory(studentId: string) {
    const history = await db.workoutHistory.findMany({
      where: { studentId },
      include: {
        workout: { select: { id: true, title: true } },
        exercises: { orderBy: { id: "asc" } },
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    return history.map((wh) => {
      let calculatedVolume = 0;
      if (wh.exercises && wh.exercises.length > 0) {
        calculatedVolume = wh.exercises.reduce((acc, el) => {
          try {
            const sets = JSON.parse(el.sets);
            if (Array.isArray(sets)) {
              return (
                acc +
                sets.reduce(
                  (
                    setAcc: number,
                    set: {
                      weight?: number;
                      reps?: number;
                      completed?: boolean;
                    },
                  ) => {
                    if (set.weight && set.reps && set.completed) {
                      return setAcc + set.weight * set.reps;
                    }
                    return setAcc;
                  },
                  0,
                )
              );
            }
          } catch (_e) {}
          return acc;
        }, 0);
      }

      return {
        ...wh,
        workoutName: wh.workout?.title ?? "Treino",
        totalVolume: wh.totalVolume || calculatedVolume,
        exercises: wh.exercises.map((el) => ({
          ...el,
          sets: JSON.parse(el.sets),
          notes: el.notes || undefined,
          formCheckScore: el.formCheckScore || undefined,
        })),
      };
    });
  }

  private static async getPersonalRecords(studentId: string) {
    return db.personalRecord.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 10,
    });
  }

  private static async getWeightHistory(studentId: string) {
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
  }

  private static async getMemberships(studentId: string) {
    try {
      const memberships = await db.gymMembership.findMany({
        where: { studentId },
        include: {
          gym: { select: { id: true, name: true, logo: true, address: true } },
          plan: { select: { id: true, name: true, type: true } },
        },
      });
      return memberships.map((m) => ({
        id: m.id,
        gymId: m.gymId,
        gymName: m.gym.name,
        gymLogo: m.gym.logo || undefined,
        gymAddress: m.gym.address,
        planId: m.planId,
        planName: m.plan?.name || "",
        planType: m.plan?.type || "monthly",
        startDate: m.startDate,
        nextBillingDate: m.nextBillingDate,
        amount: m.amount,
        status: m.status,
        autoRenew: m.autoRenew,
      }));
    } catch (_e) {
      return [];
    }
  }

  private static async getPayments(studentId: string) {
    try {
      const payments = await db.payment.findMany({
        where: { studentId },
        include: {
          plan: { select: { name: true } },
          gym: { select: { name: true } },
        },
        orderBy: { date: "desc" },
        take: 50,
      });
      return payments.map((p) => ({
        id: p.id,
        gymId: p.gymId,
        gymName: p.gym.name,
        planName: p.plan?.name || "",
        amount: p.amount,
        date: p.date,
        dueDate: p.dueDate,
        status: p.withdrawnAt ? "withdrawn" : p.status,
        paymentMethod: p.paymentMethod || undefined,
        reference: p.reference || undefined,
      }));
    } catch (_e) {
      return [];
    }
  }

  private static async getPaymentMethods(userId: string) {
    try {
      const methods = await db.paymentMethod.findMany({ where: { userId } });
      return methods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        isDefault: pm.isDefault,
        cardBrand: pm.cardBrand || undefined,
        last4: pm.last4 || undefined,
        expiryMonth: pm.expiryMonth || undefined,
        expiryYear: pm.expiryYear || undefined,
        holderName: pm.holderName || undefined,
        pixKey: pm.pixKey || undefined,
        pixKeyType: pm.pixKeyType || undefined,
      }));
    } catch (_e) {
      return [];
    }
  }

  private static async getDayPasses(studentId: string) {
    try {
      const passes = await db.dayPass.findMany({
        where: { studentId },
        orderBy: { purchaseDate: "desc" },
        take: 50,
      });
      return passes.map((dp) => ({
        id: dp.id,
        gymId: dp.gymId,
        gymName: dp.gymName,
        purchaseDate: dp.purchaseDate,
        validDate: dp.validDate,
        price: dp.price,
        status: dp.status,
        qrCode: dp.qrCode || undefined,
      }));
    } catch (_e) {
      return [];
    }
  }

  private static async getGymLocations() {
    try {
      const gyms = await db.gym.findMany({
        where: { isActive: true },
        include: {
          plans: { where: { isActive: true }, orderBy: { price: "asc" } },
        },
        orderBy: { rating: "desc" },
      });

      return gyms.map((gym) => {
        let amenities: string[] = [];
        try {
          amenities = gym.amenities ? JSON.parse(gym.amenities) : [];
        } catch (_e) {}

        let openingHours: {
          open?: string;
          close?: string;
          days?: string[];
        } | null = null;
        try {
          openingHours = gym.openingHours ? JSON.parse(gym.openingHours) : null;
        } catch (_e) {}

        const plansByType: Record<string, number> = {};
        gym.plans.forEach((p) => {
          plansByType[p.type] = p.price;
        });

        // Basic openNow logic
        const now = new Date();
        let openNow = true;
        if (
          openingHours?.days &&
          !openingHours.days.includes(
            [
              "sunday",
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ][now.getDay()],
          )
        ) {
          openNow = false;
        }

        return {
          id: gym.id,
          name: gym.name,
          logo: gym.logo || undefined,
          address: gym.address,
          coordinates: { lat: gym.latitude || 0, lng: gym.longitude || 0 },
          rating: gym.rating || 0,
          totalReviews: gym.totalReviews || 0,
          plans: {
            daily: plansByType.daily ?? 0,
            weekly: plansByType.weekly ?? 0,
            monthly: plansByType.monthly ?? 0,
          },
          amenities,
          openNow,
          openingHours: openingHours
            ? { open: openingHours.open, close: openingHours.close }
            : { open: "06:00", close: "22:00" },
          isPartner: "isPartner" in gym && gym.isPartner === true,
        };
      });
    } catch (_e) {
      return [];
    }
  }

  private static async getFriends(studentId: string) {
    try {
      const friendships = await db.friendship.findMany({
        where: { userId: studentId, status: "accepted" },
        include: {
          friend: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });
      return {
        count: friendships.length,
        list: friendships.map((f) => ({
          id: f.friend.id,
          name: f.friend.user.name,
          avatar: f.friend.user.image || undefined,
          username: undefined,
        })),
      };
    } catch (_e) {
      return { count: 0, list: [] };
    }
  }
}
