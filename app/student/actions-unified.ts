/**
 * Server Actions Unificadas para Student
 *
 * Esta função consolida todas as buscas de dados do student em uma única chamada,
 * otimizando queries e reduzindo round-trips ao banco de dados.
 */

"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";
import type { MuscleGroup } from "@/lib/types";
import {
  mockUserProgress,
  mockWorkoutHistory,
  mockPersonalRecords,
  mockWeightHistory,
} from "@/lib/mock-data";
import { mockUnits } from "@/lib/mock-data";
import { mockGymLocations } from "@/lib/gym-mock-data";

// ============================================
// HELPER: Obter Student ID
// ============================================

async function getStudentId(): Promise<{
  studentId: string | null;
  userId: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return { studentId: null, userId: null };
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return { studentId: null, userId: null };
    }

    const userId = session.userId;

    // Se for ADMIN, garantir que tenha perfil de student
    let studentId: string | null = null;
    if (session.user.role === "ADMIN") {
      const existingStudent = await db.student.findUnique({
        where: { userId: session.user.id },
      });

      if (!existingStudent) {
        const newStudent = await db.student.create({
          data: {
            userId: session.user.id,
          },
        });
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }
    } else if (session.user.student?.id) {
      studentId = session.user.student.id;
    }

    return { studentId, userId };
  } catch (error) {
    console.error("[getStudentId] Erro:", error);
    return { studentId: null, userId: null };
  }
}

// ============================================
// FUNÇÃO PRINCIPAL: Buscar Todos os Dados
// ============================================

export async function getAllStudentData(sections?: string[]) {
  try {
    const { studentId, userId } = await getStudentId();

    if (!studentId || !userId) {
      return getMockData();
    }

    // Se sections for especificado, buscar apenas essas seções
    const requestedSections = sections
      ? sections.filter((s) => s !== "actions" && s !== "loaders")
      : null;

    const result: any = {};

    // === USER INFO ===
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
          username: user.email
            ? `@${user.email.split("@")[0].toLowerCase()}`
            : "@usuario",
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

    // === STUDENT INFO ===
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
        result.student = {
          id: student.id,
          age: student.age,
          gender: student.gender,
          phone: student.phone,
          avatar: student.avatar,
        };
      }
    }

    // === PROGRESS ===
    if (!requestedSections || requestedSections.includes("progress")) {
      const progress = await db.studentProgress.findUnique({
        where: { studentId },
      });

      if (progress) {
        // Buscar achievements
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
          category: unlock.achievement.category as
            | "streak"
            | "workouts"
            | "xp"
            | "perfect"
            | "special",
          level: unlock.achievement.level || undefined,
          color: unlock.achievement.color || "#58CC02",
        }));

        // Calcular weeklyXP
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
          weeklyXP[dayOfWeek] += wh.workout.xpReward;
        });

        result.progress = {
          currentStreak: progress.currentStreak || 0,
          longestStreak: progress.longestStreak || 0,
          totalXP: progress.totalXP || 0,
          currentLevel: progress.currentLevel || 1,
          xpToNextLevel: progress.xpToNextLevel || 100,
          workoutsCompleted: progress.workoutsCompleted || 0,
          todayXP: progress.todayXP || 0,
          achievements,
          lastActivityDate: progress.lastActivityDate
            ? progress.lastActivityDate.toISOString()
            : new Date().toISOString(),
          dailyGoalXP: progress.dailyGoalXP || 50,
          weeklyXP,
        };
      }
    }

    // === PROFILE ===
    if (!requestedSections || requestedSections.includes("profile")) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: { profile: true },
      });

      if (student?.profile) {
        result.profile = {
          height: student.profile.height,
          weight: student.profile.weight,
          fitnessLevel: student.profile.fitnessLevel,
          weeklyWorkoutFrequency: student.profile.weeklyWorkoutFrequency,
          workoutDuration: student.profile.workoutDuration,
          goals: student.profile.goals ? JSON.parse(student.profile.goals) : [],
          injuries: student.profile.injuries
            ? JSON.parse(student.profile.injuries)
            : [],
          availableEquipment: student.profile.availableEquipment
            ? JSON.parse(student.profile.availableEquipment)
            : [],
          gymType: student.profile.gymType,
          preferredWorkoutTime: student.profile.preferredWorkoutTime,
          preferredSets: student.profile.preferredSets,
          preferredRepRange: student.profile.preferredRepRange,
          restTime: student.profile.restTime,
          dietType: student.profile.dietType,
          allergies: student.profile.allergies
            ? JSON.parse(student.profile.allergies)
            : [],
          targetCalories: student.profile.targetCalories,
          targetProtein: student.profile.targetProtein,
          targetCarbs: student.profile.targetCarbs,
          targetFats: student.profile.targetFats,
          mealsPerDay: student.profile.mealsPerDay,
          hasWeightLossGoal: (() => {
            if (student.profile.goals) {
              try {
                const goals = JSON.parse(student.profile.goals);
                return Array.isArray(goals) && goals.includes("perder-peso");
              } catch {
                return false;
              }
            }
            return false;
          })(),
        };
      }
    }

    // === WEIGHT HISTORY ===
    if (!requestedSections || requestedSections.includes("weightHistory")) {
      try {
        const weightHistoryData = await db.weightHistory.findMany({
          where: { studentId },
          orderBy: { date: "desc" },
          take: 30,
        });

        result.weightHistory = weightHistoryData.map((wh) => ({
          date: wh.date,
          weight: wh.weight,
          notes: wh.notes || undefined,
        }));

        // Calcular weightGain (último mês)
        if (result.weightHistory.length > 0) {
          const currentWeight = result.weightHistory[0].weight;
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          const weightOneMonthAgo = await db.weightHistory.findFirst({
            where: {
              studentId,
              date: { lte: oneMonthAgo },
            },
            orderBy: { date: "desc" },
          });

          if (weightOneMonthAgo) {
            result.weightGain = currentWeight - weightOneMonthAgo.weight;
          }
        }
      } catch (error: any) {
        if (
          error.code === "P2021" ||
          error.message?.includes("does not exist")
        ) {
          result.weightHistory = mockWeightHistory;
        }
      }
    }

    // === UNITS E WORKOUTS ===
    if (!requestedSections || requestedSections.includes("units")) {
      try {
        const units = await db.unit.findMany({
          orderBy: { order: "asc" },
          include: {
            workouts: {
              orderBy: { order: "asc" },
              include: {
                exercises: {
                  orderBy: { order: "asc" },
                  include: {
                    alternatives: {
                      orderBy: { order: "asc" },
                    },
                  },
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
          completedWorkoutIds.map((wh) => wh.workoutId)
        );

        result.units = units.map((unit) => ({
          id: unit.id,
          title: unit.title,
          description: unit.description || "",
          color: unit.color || "#58CC02",
          icon: unit.icon || "💪",
          workouts: unit.workouts.map((workout) => {
            const isCompleted = completedIdsSet.has(workout.id);
            const lastCompletion = workout.completions[0];

            // Calcular locked
            let isLocked = workout.locked;
            const workoutIndex = unit.workouts.findIndex(
              (w) => w.id === workout.id
            );
            const unitIndex = units.findIndex((u) => u.id === unit.id);

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

            // Calcular stars
            let stars: number | undefined = undefined;
            if (lastCompletion) {
              if (lastCompletion.overallFeedback === "excelente") {
                stars = 3;
              } else if (lastCompletion.overallFeedback === "bom") {
                stars = 2;
              } else if (lastCompletion.overallFeedback === "regular") {
                stars = 1;
              } else {
                stars = 0;
              }
            }

            return {
              id: workout.id,
              title: workout.title,
              description: workout.description || "",
              type: workout.type as
                | "strength"
                | "cardio"
                | "flexibility"
                | "rest",
              muscleGroup: workout.muscleGroup as MuscleGroup,
              difficulty: workout.difficulty as
                | "iniciante"
                | "intermediario"
                | "avancado",
              exercises: workout.exercises.map((exercise) => ({
                id: exercise.id,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                rest: exercise.rest,
                notes: exercise.notes || undefined,
                videoUrl: exercise.videoUrl || undefined,
                educationalId: exercise.educationalId || undefined,
                alternatives:
                  exercise.alternatives.length > 0
                    ? exercise.alternatives.map((alt) => ({
                        id: alt.id,
                        name: alt.name,
                        reason: alt.reason,
                        educationalId: alt.educationalId || undefined,
                      }))
                    : undefined,
              })),
              xpReward: workout.xpReward,
              estimatedTime: workout.estimatedTime,
              locked: isLocked,
              completed: isCompleted,
              stars: stars,
              completedAt: lastCompletion?.date || undefined,
            };
          }),
        }));
      } catch (error) {
        console.error("Erro ao buscar units:", error);
        result.units = mockUnits;
      }
    }

    // === WORKOUT HISTORY ===
    if (!requestedSections || requestedSections.includes("workoutHistory")) {
      const workoutHistoryData = await db.workoutHistory.findMany({
        where: { studentId },
        include: {
          workout: {
            select: {
              id: true,
              title: true,
            },
          },
          exercises: {
            orderBy: { id: "asc" },
          },
        },
        orderBy: { date: "desc" },
        take: 10,
      });

      result.workoutHistory = workoutHistoryData.map((wh) => {
        let calculatedVolume = 0;
        if (wh.exercises && wh.exercises.length > 0) {
          calculatedVolume = wh.exercises.reduce((acc, el) => {
            try {
              const sets = JSON.parse(el.sets);
              if (Array.isArray(sets)) {
                return (
                  acc +
                  sets.reduce((setAcc: number, set: any) => {
                    if (set.weight && set.reps && set.completed) {
                      return setAcc + set.weight * set.reps;
                    }
                    return setAcc;
                  }, 0)
                );
              }
            } catch (e) {
              // Ignorar erro de parse
            }
            return acc;
          }, 0);
        }

        let bodyPartsFatigued: MuscleGroup[] = [];
        if (wh.bodyPartsFatigued) {
          try {
            const parsed = JSON.parse(wh.bodyPartsFatigued);
            if (Array.isArray(parsed)) {
              bodyPartsFatigued = parsed.filter(
                (item): item is MuscleGroup =>
                  typeof item === "string" &&
                  [
                    "peito",
                    "costas",
                    "pernas",
                    "ombros",
                    "bracos",
                    "core",
                    "gluteos",
                    "cardio",
                    "funcional",
                  ].includes(item)
              );
            }
          } catch (e) {
            // Ignorar erro de parse
          }
        }

        return {
          date: wh.date,
          workoutId: wh.workoutId,
          workoutName: wh.workout.title,
          duration: wh.duration,
          totalVolume: wh.totalVolume || calculatedVolume,
          exercises: wh.exercises.map((el) => {
            let sets: any[] = [];
            try {
              sets = JSON.parse(el.sets);
            } catch (e) {
              // Ignorar erro de parse
            }

            return {
              id: el.id,
              exerciseId: el.exerciseId,
              exerciseName: el.exerciseName,
              workoutId: wh.workoutId,
              date: wh.date,
              sets: sets,
              notes: el.notes || undefined,
              formCheckScore: el.formCheckScore || undefined,
              difficulty:
                el.difficulty &&
                [
                  "muito-facil",
                  "facil",
                  "ideal",
                  "dificil",
                  "muito-dificil",
                ].includes(el.difficulty)
                  ? (el.difficulty as
                      | "muito-facil"
                      | "facil"
                      | "ideal"
                      | "dificil"
                      | "muito-dificil")
                  : "ideal",
            };
          }),
          overallFeedback:
            (wh.overallFeedback as "excelente" | "bom" | "regular" | "ruim") ||
            undefined,
          bodyPartsFatigued: bodyPartsFatigued,
        };
      });
    }

    // === PERSONAL RECORDS ===
    if (!requestedSections || requestedSections.includes("personalRecords")) {
      const personalRecordsData = await db.personalRecord.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: 10,
      });

      result.personalRecords = personalRecordsData.map((pr) => ({
        exerciseId: pr.exerciseId,
        exerciseName: pr.exerciseName,
        type: pr.type as "max-weight" | "max-reps" | "max-volume",
        value: pr.value,
        date: pr.date,
        previousBest: pr.previousBest || undefined,
      }));
    }

    // === DAILY NUTRITION ===
    if (!requestedSections || requestedSections.includes("dailyNutrition")) {
      try {
        // Normalizar data para UTC (evitar problemas de timezone)
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const profile = await db.studentProfile.findUnique({
          where: { studentId },
          select: {
            targetCalories: true,
            targetProtein: true,
            targetCarbs: true,
            targetFats: true,
          },
        });

        // Usar findFirst com range de datas (igual ao handler de nutrition)
        // Isso garante que encontre mesmo se a data foi salva com horas zeradas
        const dailyNutrition = await db.dailyNutrition.findFirst({
          where: {
            studentId: studentId,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            meals: {
              orderBy: { order: "asc" },
              include: {
                foods: {
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        });

        if (dailyNutrition) {
          const meals = dailyNutrition.meals.map((meal) => ({
            id: meal.id,
            name: meal.name,
            type: meal.type,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            completed: meal.completed,
            time: meal.time || undefined,
            foods: meal.foods.map((food) => ({
              id: food.id,
              foodId: food.foodId,
              foodName: food.foodName,
              servings: food.servings,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              servingSize: food.servingSize,
            })),
          }));

          result.dailyNutrition = {
            date: dailyNutrition.date.toISOString().split("T")[0],
            meals,
            totalCalories: meals.reduce((sum, m) => sum + m.calories, 0),
            totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
            totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
            totalFats: meals.reduce((sum, m) => sum + m.fats, 0),
            waterIntake: dailyNutrition.waterIntake,
            targetCalories: profile?.targetCalories || 2000,
            targetProtein: profile?.targetProtein || 150,
            targetCarbs: profile?.targetCarbs || 250,
            targetFats: profile?.targetFats || 65,
            targetWater: 2000,
          };
        } else {
          // Retornar nutrição vazia para o dia
          result.dailyNutrition = {
            date: today.toISOString().split("T")[0],
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
      } catch (error: any) {
        if (
          error.code === "P2021" ||
          error.message?.includes("does not exist")
        ) {
          // Tabela não existe, retornar vazio
          result.dailyNutrition = {
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
          };
        }
      }
    }

    // === SUBSCRIPTION ===
    if (!requestedSections || requestedSections.includes("subscription")) {
      const subscription = await db.subscription.findUnique({
        where: { studentId },
      });

      if (subscription) {
        const now = new Date();
        const trialEndDate = subscription.trialEnd
          ? new Date(subscription.trialEnd)
          : null;
        const isTrialActive = trialEndDate ? trialEndDate > now : false;

        if (subscription.status === "canceled" && !isTrialActive) {
          result.subscription = null;
        } else {
          const daysRemaining = trialEndDate
            ? Math.max(
                0,
                Math.ceil(
                  (trialEndDate.getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : null;

          const periodStart = new Date(subscription.currentPeriodStart);
          const periodEnd = new Date(subscription.currentPeriodEnd);
          const daysDiff = Math.ceil(
            (periodEnd.getTime() - periodStart.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const billingPeriod: "monthly" | "annual" =
            daysDiff >= 330 && daysDiff <= 370 ? "annual" : "monthly";

          result.subscription = {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
            isTrial: isTrialActive,
            daysRemaining,
            billingPeriod,
          };
        }
      } else {
        result.subscription = null;
      }
    }

    // === MEMBERSHIPS ===
    if (!requestedSections || requestedSections.includes("memberships")) {
      try {
        const memberships = await db.gymMembership.findMany({
          where: { studentId },
          include: {
            gym: {
              select: {
                id: true,
                name: true,
                logo: true,
                address: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        });

        result.memberships = memberships.map((m) => ({
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
      } catch (error) {
        result.memberships = [];
      }
    }

    // === PAYMENTS ===
    if (!requestedSections || requestedSections.includes("payments")) {
      try {
        const payments = await db.payment.findMany({
          where: { studentId: studentId },
          include: {
            plan: {
              select: {
                name: true,
              },
            },
            gym: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { date: "desc" },
          take: 50,
        });

        result.payments = payments.map((p) => ({
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
      } catch (error) {
        result.payments = [];
      }
    }

    // === PAYMENT METHODS ===
    if (!requestedSections || requestedSections.includes("paymentMethods")) {
      try {
        const paymentMethods = await db.paymentMethod.findMany({
          where: { userId },
        });

        result.paymentMethods = paymentMethods.map((pm) => ({
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
      } catch (error) {
        result.paymentMethods = [];
      }
    }

    // === DAY PASSES ===
    if (!requestedSections || requestedSections.includes("dayPasses")) {
      try {
        const dayPasses = await db.dayPass.findMany({
          where: { studentId },
          orderBy: { purchaseDate: "desc" },
          take: 50,
        });

        result.dayPasses = dayPasses.map((dp) => ({
          id: dp.id,
          gymId: dp.gymId,
          gymName: dp.gymName,
          purchaseDate: dp.purchaseDate,
          validDate: dp.validDate,
          price: dp.price,
          status: dp.status,
          qrCode: dp.qrCode || undefined,
        }));
      } catch (error) {
        result.dayPasses = [];
      }
    }

    // === GYM LOCATIONS ===
    if (!requestedSections || requestedSections.includes("gymLocations")) {
      try {
        const gyms = await db.gym.findMany({
          where: { isActive: true },
          include: {
            plans: {
              where: { isActive: true },
              orderBy: { price: "asc" },
            },
          },
          orderBy: { rating: "desc" },
        });

        result.gymLocations = gyms.map((gym) => {
          let amenities: string[] = [];
          if (gym.amenities) {
            try {
              amenities = JSON.parse(gym.amenities);
            } catch (e) {
              // Ignorar erro
            }
          }

          let openingHours: any = null;
          if (gym.openingHours) {
            try {
              openingHours = JSON.parse(gym.openingHours);
            } catch (e) {
              // Ignorar erro
            }
          }

          const plansByType: any = {};
          gym.plans.forEach((plan) => {
            if (plan.type === "daily") {
              plansByType.daily = plan.price;
            } else if (plan.type === "weekly") {
              plansByType.weekly = plan.price;
            } else if (plan.type === "monthly") {
              plansByType.monthly = plan.price;
            }
          });

          const now = new Date();
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const currentDayName = dayNames[now.getDay()];
          const currentTime = now.getHours() * 60 + now.getMinutes();
          let openNow = true;

          if (openingHours) {
            if (openingHours.days && openingHours.days.length > 0) {
              if (!openingHours.days.includes(currentDayName)) {
                openNow = false;
              }
            }

            if (openNow) {
              const [openHour, openMin] = openingHours.open
                .split(":")
                .map(Number);
              const [closeHour, closeMin] = openingHours.close
                .split(":")
                .map(Number);
              const openTime = openHour * 60 + openMin;
              const closeTime = closeHour * 60 + closeMin;
              openNow = currentTime >= openTime && currentTime <= closeTime;
            }
          }

          return {
            id: gym.id,
            name: gym.name,
            logo: gym.logo || undefined,
            address: gym.address,
            coordinates: {
              lat: gym.latitude || 0,
              lng: gym.longitude || 0,
            },
            rating: gym.rating || 0,
            totalReviews: gym.totalReviews || 0,
            plans: {
              daily: plansByType.daily ?? 0,
              weekly: plansByType.weekly ?? 0,
              monthly: plansByType.monthly ?? 0,
            },
            amenities: amenities,
            openNow: openNow,
            openingHours: openingHours
              ? {
                  open: openingHours.open,
                  close: openingHours.close,
                }
              : {
                  open: "06:00",
                  close: "22:00",
                },
            photos: gym.photos
              ? (() => {
                  try {
                    return JSON.parse(gym.photos);
                  } catch {
                    return undefined;
                  }
                })()
              : undefined,
            isPartner: (gym as any).isPartner || false,
          };
        });
      } catch (error) {
        result.gymLocations = mockGymLocations;
      }
    }

    // === FRIENDS ===
    if (!requestedSections || requestedSections.includes("friends")) {
      try {
        const friendships = await db.friendship.findMany({
          where: {
            userId: studentId,
            status: "accepted",
          },
          include: {
            friend: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        });

        result.friends = {
          count: friendships.length,
          list: friendships.map((f) => ({
            id: f.friend.id,
            name: f.friend.user.name,
            avatar: f.friend.user.image || undefined,
            username: undefined, // Pode ser adicionado depois
          })),
        };
      } catch (error) {
        result.friends = {
          count: 0,
          list: [],
        };
      }
    }

    // === FOOD DATABASE ===
    if (!requestedSections || requestedSections.includes("foodDatabase")) {
      // Por enquanto, retornar vazio (pode ser populado depois)
      result.foodDatabase = [];
    }

    return result;
  } catch (error) {
    console.error("[getAllStudentData] Erro:", error);
    return getMockData();
  }
}

// ============================================
// HELPER: Dados Mock
// ============================================

function getMockData() {
  return {
    user: {
      id: "",
      name: "Usuário",
      email: "",
      username: "@usuario",
      memberSince: "Jan 2025",
      role: "STUDENT" as const,
      isAdmin: false,
    },
    student: {
      id: "",
    },
    progress: mockUserProgress,
    profile: {},
    weightHistory: mockWeightHistory,
    weightGain: null,
    units: mockUnits,
    workoutHistory: mockWorkoutHistory.slice(0, 3),
    personalRecords: mockPersonalRecords,
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
    gymLocations: mockGymLocations,
    friends: {
      count: 0,
      list: [],
    },
  };
}
