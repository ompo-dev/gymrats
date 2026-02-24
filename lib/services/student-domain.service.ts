import { db } from "@/lib/db";
import type { MuscleGroup } from "@/lib/types";

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
      orderBy: { date: "desc" },
    });

    const workoutDays = new Set<string>();
    allWorkoutHistory.forEach((wh) => {
      const dateOnly = new Date(wh.date);
      dateOnly.setHours(0, 0, 0, 0);
      workoutDays.add(dateOnly.toISOString().split("T")[0]);
    });

    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // Initial check: if no workout today, check yesterday as well.
    // In Duolingo style, the streak is maintained if you haven't worked out yet today
    // as long as you worked out yesterday.
    const todayStr = checkDate.toISOString().split("T")[0];
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (!workoutDays.has(todayStr) && !workoutDays.has(yesterdayStr)) {
      currentStreak = 0;
    } else {
      // If we did a workout today or yesterday, start counting backwards
      if (!workoutDays.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (workoutDays.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return currentStreak;
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

    let newTotalXP = (progress.totalXP || 0) + amount;
    let newTodayXP = (progress.todayXP || 0) + amount;
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
    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    });

    // 1. Calculate current streak
    const calculatedStreak = await this.calculateStreak(studentId);
    
    // 2. Update streak in DB if changed
    if (progress && calculatedStreak !== (progress.currentStreak || 0)) {
        await db.studentProgress.update({
            where: { studentId },
            data: { 
                currentStreak: calculatedStreak,
                longestStreak: Math.max(calculatedStreak, progress.longestStreak || 0)
            },
        });
    }

    // 3. Fetch achievements
    const achievementUnlocks = await db.achievementUnlock.findMany({
      where: { studentId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });

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

    // 4. Calculate weekly XP (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const workoutHistoryForXP = await db.workoutHistory.findMany({
      where: {
        studentId,
        date: { gte: sevenDaysAgo },
      },
      include: {
        workout: { select: { xpReward: true } },
      },
    });

    const weeklyXP = [0, 0, 0, 0, 0, 0, 0];
    workoutHistoryForXP.forEach((wh) => {
      const dayOfWeek = wh.date.getDay();
      if (wh.workout) {
        weeklyXP[dayOfWeek] += wh.workout.xpReward || 0;
      }
    });

    return {
      currentStreak: calculatedStreak,
      longestStreak: progress ? Math.max(calculatedStreak, progress.longestStreak || 0) : 0,
      totalXP: progress?.totalXP || 0,
      currentLevel: progress?.currentLevel || 1,
      xpToNextLevel: progress?.xpToNextLevel || 100,
      workoutsCompleted: progress?.workoutsCompleted || 0,
      todayXP: progress?.todayXP || 0,
      achievements,
      lastActivityDate: progress?.lastActivityDate?.toISOString() || new Date().toISOString(),
      dailyGoalXP: progress?.dailyGoalXP || 50,
      weeklyXP,
    };
  }

  /**
   * Updates student progress data
   */
  static async updateProgress(studentId: string, data: any) {
    return db.studentProgress.upsert({
      where: { studentId },
      create: { 
        studentId, 
        ...data,
        lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate) : undefined
      },
      update: {
        ...data,
        lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate) : undefined
      },
    });
  }

  /**
   * Upserts student profile data
   */
  static async upsertProfile(studentId: string, data: any) {
    return db.studentProfile.upsert({
      where: { studentId },
      create: { studentId, ...data },
      update: data,
    });
  }

  /**
   * Aggregate method to fetch all student data (replacement for getAllStudentData)
   */
  static async getAllData(studentId: string, userId: string, sections?: string[]) {
    const requestedSections = sections
      ? sections.filter((s) => s !== "actions" && s !== "loaders")
      : null;

    const result: Record<string, any> = {};

    // 1. User Info
    if (!requestedSections || requestedSections.includes("user")) {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
        });
        if (user) {
            result.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                username: `@${user.email.split("@")[0].toLowerCase()}`,
                memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "Jan 2025",
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
            select: { id: true, age: true, gender: true, phone: true, avatar: true },
        });
        if (student) result.student = student;
    }

    // 3. Progress (Delegated to specialized method)
    if (!requestedSections || requestedSections.includes("progress")) {
        result.progress = await this.getProgress(studentId);
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
                availableEquipment: p.availableEquipment ? JSON.parse(p.availableEquipment) : [],
                allergies: p.allergies ? JSON.parse(p.allergies) : [],
                hasWeightLossGoal: p.goals ? p.goals.includes("perder-peso") : false,
            };
        }
    }

    // 5. Units & Workouts
    if (!requestedSections || requestedSections.includes("units")) {
        result.units = await this.getUnitsWithWorkouts(studentId);
    }

    // 6. Subscription
    if (!requestedSections || requestedSections.includes("subscription")) {
        result.subscription = await this.getSubscription(studentId);
    }

    // 7. Others (Nutrition, History, etc.)
    if (!requestedSections || requestedSections.includes("dailyNutrition")) {
        result.dailyNutrition = await this.getDailyNutrition(studentId);
    }

    if (!requestedSections || requestedSections.includes("workoutHistory")) {
        result.workoutHistory = await this.getWorkoutHistory(studentId);
    }

    if (!requestedSections || requestedSections.includes("personalRecords")) {
        result.personalRecords = await this.getPersonalRecords(studentId);
    }

    if (!requestedSections || requestedSections.includes("weightHistory")) {
        result.weightHistory = await this.getWeightHistory(studentId);
    }

    if (!requestedSections || requestedSections.includes("memberships")) {
        result.memberships = await this.getMemberships(studentId);
    }

    if (!requestedSections || requestedSections.includes("payments")) {
        result.payments = await this.getPayments(studentId);
    }

    if (!requestedSections || requestedSections.includes("paymentMethods")) {
        result.paymentMethods = await this.getPaymentMethods(userId);
    }

    if (!requestedSections || requestedSections.includes("dayPasses")) {
        result.dayPasses = await this.getDayPasses(studentId);
    }

    if (!requestedSections || requestedSections.includes("gymLocations")) {
        result.gymLocations = await this.getGymLocations();
    }

    if (!requestedSections || requestedSections.includes("friends")) {
        result.friends = await this.getFriends(studentId);
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
                    exercises: { orderBy: { order: "asc" }, include: { alternatives: { orderBy: { order: "asc" } } } },
                    completions: { where: { studentId }, orderBy: { date: "desc" }, take: 1 },
                },
            },
        },
    });

    const completedWorkoutIds = await db.workoutHistory.findMany({
        where: { studentId },
        select: { workoutId: true },
        distinct: ["workoutId"],
    });
    const completedIdsSet = new Set(completedWorkoutIds.map((wh) => wh.workoutId));

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
                            previousWorkout = previousUnit.workouts[previousUnit.workouts.length - 1];
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
                exercises: workout.exercises.map(ex => ({
                    ...ex,
                    notes: ex.notes || undefined,
                    videoUrl: ex.videoUrl || undefined,
                    educationalId: ex.educationalId || undefined,
                    alternatives: ex.alternatives.length > 0 ? ex.alternatives : undefined,
                })),
                xpReward: workout.xpReward,
                estimatedTime: workout.estimatedTime,
                locked: isLocked,
                completed: isCompleted,
                stars: lastCompletion ? (lastCompletion.overallFeedback === "excelente" ? 3 : lastCompletion.overallFeedback === "bom" ? 2 : 1) : 0,
                completedAt: lastCompletion?.date,
            };
        })
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
    const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24));
    const billingPeriod = daysDiff >= 330 && daysDiff <= 370 ? "annual" : "monthly";

    return {
        ...sub,
        isTrial,
        daysRemaining: trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24))) : null,
        billingPeriod,
    };
  }

  private static async getDailyNutrition(studentId: string) {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const profile = await db.studentProfile.findUnique({
        where: { studentId },
        select: { targetCalories: true, targetProtein: true, targetCarbs: true, targetFats: true },
    });

    const daily = await db.dailyNutrition.findFirst({
        where: { studentId, date: { gte: startOfDay, lte: endOfDay } },
        include: { meals: { orderBy: { order: "asc" }, include: { foods: { orderBy: { createdAt: "asc" } } } } }
    });

    if (daily) {
        const meals = daily.meals.map(m => ({
            ...m,
            foods: m.foods.map(f => ({ ...f, id: f.id }))
        }));
        return {
            date: dateStr,
            meals,
            totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
            totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
            totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
            totalFats: meals.reduce((sum, m) => sum + m.fats, 0),
            waterIntake: daily.waterIntake,
            targetCalories: profile?.targetCalories || 2000,
            targetProtein: profile?.targetProtein || 150,
            targetCarbs: profile?.targetCarbs || 250,
            targetFats: profile?.targetFats || 65,
            targetWater: 2000,
        };
    }

    return {
        date: dateStr,
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
        waterIntake: 0,
        targetCalories: profile?.targetCalories || 2000,
        targetProtein: profile?.targetProtein || 150,
        targetCarbs: profile?.targetCarbs || 250,
        targetFats: profile?.targetFats || 65,
        targetWater: 2000,
    };
  }

  private static async getWorkoutHistory(studentId: string) {
    const history = await db.workoutHistory.findMany({
        where: { studentId },
        include: { workout: { select: { id: true, title: true } }, exercises: { orderBy: { id: "asc" } } },
        orderBy: { date: "desc" },
        take: 10,
    });
    
    return history.map(wh => {
        let calculatedVolume = 0;
        if (wh.exercises && wh.exercises.length > 0) {
            calculatedVolume = wh.exercises.reduce((acc, el) => {
                try {
                    const sets = JSON.parse(el.sets);
                    if (Array.isArray(sets)) {
                        return acc + sets.reduce((setAcc: number, set: any) => {
                            if (set.weight && set.reps && set.completed) {
                                return setAcc + (set.weight * set.reps);
                            }
                            return setAcc;
                        }, 0);
                    }
                } catch (e) {}
                return acc;
            }, 0);
        }

        return {
            ...wh,
            workoutName: wh.workout?.title ?? "Treino",
            totalVolume: wh.totalVolume || calculatedVolume,
            exercises: wh.exercises.map(el => ({
                ...el,
                sets: JSON.parse(el.sets),
                notes: el.notes || undefined,
                formCheckScore: el.formCheckScore || undefined,
            }))
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
        weightGain
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
        return memberships.map(m => ({
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
    } catch (_e) { return []; }
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
        return payments.map(p => ({
            id: p.id,
            gymId: p.gymId,
            gymName: p.gym.name,
            planName: p.plan?.name || "",
            amount: p.amount,
            date: p.date,
            dueDate: p.dueDate,
            status: p.status,
            paymentMethod: p.paymentMethod || undefined,
            reference: p.reference || undefined,
        }));
    } catch (_e) { return []; }
  }

  private static async getPaymentMethods(userId: string) {
    try {
        const methods = await db.paymentMethod.findMany({ where: { userId } });
        return methods.map(pm => ({
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
    } catch (_e) { return []; }
  }

  private static async getDayPasses(studentId: string) {
    try {
        const passes = await db.dayPass.findMany({
            where: { studentId },
            orderBy: { purchaseDate: "desc" },
            take: 50,
        });
        return passes.map(dp => ({
            id: dp.id,
            gymId: dp.gymId,
            gymName: dp.gymName,
            purchaseDate: dp.purchaseDate,
            validDate: dp.validDate,
            price: dp.price,
            status: dp.status,
            qrCode: dp.qrCode || undefined,
        }));
    } catch (_e) { return []; }
  }

  private static async getGymLocations() {
    try {
        const gyms = await db.gym.findMany({
            where: { isActive: true },
            include: { plans: { where: { isActive: true }, orderBy: { price: "asc" } } },
            orderBy: { rating: "desc" },
        });

        return gyms.map(gym => {
            let amenities: string[] = [];
            try { amenities = gym.amenities ? JSON.parse(gym.amenities) : []; } catch (_e) {}
            
            let openingHours: any = null;
            try { openingHours = gym.openingHours ? JSON.parse(gym.openingHours) : null; } catch (_e) {}

            const plansByType: any = {};
            gym.plans.forEach(p => { plansByType[p.type] = p.price; });

            // Basic openNow logic
            const now = new Date();
            let openNow = true;
            if (openingHours && openingHours.days && !openingHours.days.includes(["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()])) {
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
                plans: { daily: plansByType.daily ?? 0, weekly: plansByType.weekly ?? 0, monthly: plansByType.monthly ?? 0 },
                amenities,
                openNow,
                openingHours: openingHours ? { open: openingHours.open, close: openingHours.close } : { open: "06:00", close: "22:00" },
                isPartner: (gym as any).isPartner || false,
            };
        });
    } catch (_e) { return []; }
  }

  private static async getFriends(studentId: string) {
    try {
        const friendships = await db.friendship.findMany({
            where: { userId: studentId, status: "accepted" },
            include: { friend: { include: { user: { select: { id: true, name: true, image: true } } } } },
        });
        return {
            count: friendships.length,
            list: friendships.map(f => ({
                id: f.friend.id,
                name: f.friend.user.name,
                avatar: f.friend.user.image || undefined,
                username: undefined,
            })),
        };
    } catch (_e) { return { count: 0, list: [] }; }
  }
}
