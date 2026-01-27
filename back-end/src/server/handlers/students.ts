import { db } from "@/lib/db";
import type { Context } from "elysia";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import type { MuscleGroup } from "@/lib/types";
import {
  addWeightSchema,
  studentSectionsQuerySchema,
  updateStudentProfileSchema,
  updateStudentProgressSchema,
  weightHistoryQuerySchema,
} from "@gymrats/contracts";
import {
  mockPersonalRecords,
  mockUnits,
  mockUserProgress,
  mockWeightHistory,
  mockWorkoutHistory,
} from "@/lib/mock-data";
import { mockGymLocations } from "@/lib/gym-mock-data";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type StudentContext = {
  set: Context["set"];
  body?: unknown;
  query?: Record<string, unknown>;
  studentId: string;
  userId: string;
};

export async function getAllStudentDataHandler({
  set,
  query,
  studentId,
  userId,
}: StudentContext) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<string, unknown>,
      studentSectionsQuerySchema
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors }
      );
    }

    const sectionsParam = queryValidation.data.sections as string | undefined;
    let sections: string[] | undefined = undefined;
    if (sectionsParam) {
      sections = sectionsParam.split(",").map((s) => s.trim());
    }

    const data = await getAllStudentDataForUser({
      studentId,
      userId,
      sections,
    });

    set.headers["Cache-Control"] =
      "private, no-cache, no-store, must-revalidate";
    set.headers["Content-Type"] = "application/json";
    set.status = 200;

    return data;
  } catch (error) {
    console.error("[getAllStudentDataHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar dados do student", error);
  }
}

export async function getStudentProfileHandler({
  set,
  studentId,
  userId,
}: StudentContext) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!user || !user.student) {
      return successResponse(set, { hasProfile: false });
    }

    const hasProfile =
      !!user.student.profile &&
      user.student.profile.height !== null &&
      user.student.profile.weight !== null &&
      user.student.profile.fitnessLevel !== null;

    return successResponse(set, {
      hasProfile,
      student: {
        id: user.student.id,
        age: user.student.age,
        gender: user.student.gender,
        isTrans: user.student.isTrans ?? false,
        usesHormones: user.student.usesHormones ?? false,
        hormoneType: user.student.hormoneType || null,
      },
      profile: user.student.profile
        ? {
            height: user.student.profile.height,
            weight: user.student.profile.weight,
            fitnessLevel: user.student.profile.fitnessLevel,
            weeklyWorkoutFrequency:
              user.student.profile.weeklyWorkoutFrequency,
            workoutDuration: user.student.profile.workoutDuration,
            goals: user.student.profile.goals
              ? JSON.parse(user.student.profile.goals)
              : [],
            availableEquipment: user.student.profile.availableEquipment
              ? JSON.parse(user.student.profile.availableEquipment)
              : [],
            gymType: user.student.profile.gymType,
            preferredWorkoutTime: user.student.profile.preferredWorkoutTime,
            preferredSets: user.student.profile.preferredSets,
            preferredRepRange: user.student.profile.preferredRepRange,
            restTime: user.student.profile.restTime,
            bmr: user.student.profile.bmr,
            tdee: user.student.profile.tdee,
            targetCalories: user.student.profile.targetCalories,
            targetProtein: user.student.profile.targetProtein,
            targetCarbs: user.student.profile.targetCarbs,
            targetFats: user.student.profile.targetFats,
            activityLevel: user.student.profile.activityLevel,
            hormoneTreatmentDuration:
              user.student.profile.hormoneTreatmentDuration,
            physicalLimitations: user.student.profile.physicalLimitations
              ? JSON.parse(user.student.profile.physicalLimitations)
              : [],
            motorLimitations: user.student.profile.motorLimitations
              ? JSON.parse(user.student.profile.motorLimitations)
              : [],
            medicalConditions: user.student.profile.medicalConditions
              ? JSON.parse(user.student.profile.medicalConditions)
              : [],
            limitationDetails: user.student.profile.limitationDetails
              ? JSON.parse(user.student.profile.limitationDetails)
              : null,
            dailyAvailableHours: user.student.profile.dailyAvailableHours,
            injuries: user.student.profile.injuries
              ? JSON.parse(user.student.profile.injuries)
              : [],
          }
        : null,
    });
  } catch (error) {
    console.error("[getStudentProfileHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar perfil", error);
  }
}

export async function updateStudentProfileHandler({
  set,
  body,
  studentId,
  userId,
}: StudentContext) {
  try {
    const validation = validateBody(body, updateStudentProfileSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const data = validation.data as any;
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!user) {
      return badRequestResponse(set, "Usuário não encontrado");
    }

    if (user.role !== "STUDENT") {
      return badRequestResponse(set, "Usuário não é um aluno");
    }

    let student = user.student;
    if (!student) {
      student = await db.student.create({
        data: {
          userId,
          age: data.age,
          gender: data.gender,
          isTrans: data.isTrans ?? false,
          usesHormones: data.usesHormones ?? false,
          hormoneType: data.hormoneType || null,
        },
      });
    } else {
      student = await db.student.update({
        where: { id: student.id },
        data: {
          age: data.age,
          gender: data.gender,
          isTrans: data.isTrans ?? undefined,
          usesHormones: data.usesHormones ?? undefined,
          hormoneType: data.hormoneType || null,
        },
      });
    }

    const profileData = {
      studentId: student.id,
      height: data.height
        ? typeof data.height === "number"
          ? data.height
          : parseFloat(String(data.height))
        : null,
      weight: data.weight
        ? typeof data.weight === "number"
          ? data.weight
          : parseFloat(String(data.weight))
        : null,
      fitnessLevel: data.fitnessLevel || null,
      weeklyWorkoutFrequency: data.weeklyWorkoutFrequency
        ? parseInt(String(data.weeklyWorkoutFrequency))
        : null,
      workoutDuration: data.workoutDuration
        ? parseInt(String(data.workoutDuration))
        : null,
      goals:
        data.goals && Array.isArray(data.goals)
          ? JSON.stringify(data.goals)
          : null,
      injuries:
        data.injuries && Array.isArray(data.injuries)
          ? JSON.stringify(data.injuries)
          : null,
      availableEquipment:
        data.availableEquipment && Array.isArray(data.availableEquipment)
          ? JSON.stringify(data.availableEquipment)
          : null,
      gymType: data.gymType || null,
      preferredWorkoutTime: data.preferredWorkoutTime || null,
      preferredSets: data.preferredSets
        ? parseInt(String(data.preferredSets))
        : null,
      preferredRepRange: data.preferredRepRange || null,
      restTime: data.restTime || null,
      dietType: data.dietType || null,
      allergies:
        data.allergies && Array.isArray(data.allergies)
          ? JSON.stringify(data.allergies)
          : null,
      targetCalories: data.targetCalories
        ? parseInt(String(data.targetCalories))
        : null,
      targetProtein: data.targetProtein
        ? typeof data.targetProtein === "number"
          ? data.targetProtein
          : parseFloat(String(data.targetProtein))
        : null,
      targetCarbs: data.targetCarbs
        ? typeof data.targetCarbs === "number"
          ? data.targetCarbs
          : parseFloat(String(data.targetCarbs))
        : null,
      targetFats: data.targetFats
        ? typeof data.targetFats === "number"
          ? data.targetFats
          : parseFloat(String(data.targetFats))
        : null,
      mealsPerDay: data.mealsPerDay ? parseInt(String(data.mealsPerDay)) : null,
      bmr: data.bmr
        ? typeof data.bmr === "number"
          ? data.bmr
          : parseFloat(String(data.bmr))
        : null,
      tdee: data.tdee
        ? typeof data.tdee === "number"
          ? data.tdee
          : parseFloat(String(data.tdee))
        : null,
      activityLevel: data.activityLevel
        ? parseInt(String(data.activityLevel))
        : null,
      hormoneTreatmentDuration: data.hormoneTreatmentDuration
        ? parseInt(String(data.hormoneTreatmentDuration))
        : null,
      physicalLimitations:
        data.physicalLimitations && Array.isArray(data.physicalLimitations)
          ? JSON.stringify(data.physicalLimitations)
          : null,
      motorLimitations:
        data.motorLimitations && Array.isArray(data.motorLimitations)
          ? JSON.stringify(data.motorLimitations)
          : null,
      medicalConditions:
        data.medicalConditions && Array.isArray(data.medicalConditions)
          ? JSON.stringify(data.medicalConditions)
          : null,
      limitationDetails:
        data.limitationDetails && typeof data.limitationDetails === "object"
          ? JSON.stringify(data.limitationDetails)
          : null,
      dailyAvailableHours: data.dailyAvailableHours
        ? typeof data.dailyAvailableHours === "number"
          ? data.dailyAvailableHours
          : parseFloat(String(data.dailyAvailableHours))
        : null,
    };

    await db.studentProfile.upsert({
      where: { studentId: student.id },
      create: profileData,
      update: profileData,
    });

    const existingProgress = await db.studentProgress.findUnique({
      where: { studentId: student.id },
    });

    if (!existingProgress) {
      await db.studentProgress.create({
        data: {
          studentId: student.id,
        },
      });
    }

    await initializeStudentTrial(student.id);

    return successResponse(set, { message: "Perfil salvo com sucesso" });
  } catch (error) {
    console.error("[updateStudentProfileHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao salvar perfil", error);
  }
}

export async function getWeightHistoryHandler({
  set,
  query,
  studentId,
}: StudentContext) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<string, unknown>,
      weightHistoryQuerySchema
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors }
      );
    }

    const limit = queryValidation.data.limit || 30;
    const offset = queryValidation.data.offset || 0;

    const weightHistory = await db.weightHistory.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });

    const formattedHistory = weightHistory.map((wh) => ({
      date: wh.date,
      weight: wh.weight,
      notes: wh.notes || undefined,
    }));

    const total = await db.weightHistory.count({ where: { studentId } });

    return successResponse(set, {
      history: formattedHistory,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[getWeightHistoryHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar histórico", error);
  }
}

export async function addWeightHandler({ set, body, studentId }: StudentContext) {
  try {
    const validation = validateBody(body, addWeightSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const { weight, date, notes } = validation.data as any;
    const weightEntry = await db.weightHistory.create({
      data: {
        studentId,
        weight,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    });

    await db.studentProfile.update({
      where: { studentId },
      data: { weight },
    });

    return successResponse(set, {
      weightEntry: {
        id: weightEntry.id,
        weight: weightEntry.weight,
        date: weightEntry.date,
        notes: weightEntry.notes,
      },
    });
  } catch (error) {
    console.error("[addWeightHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao salvar peso", error);
  }
}

export async function getWeightHistoryFilteredHandler({
  set,
  query,
  studentId,
}: StudentContext) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<string, unknown>,
      weightHistoryQuerySchema
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors }
      );
    }

    const limit = queryValidation.data.limit || 30;
    const offset = queryValidation.data.offset || 0;
    const startDate = queryValidation.data.startDate;
    const endDate = queryValidation.data.endDate;

    const where: Record<string, any> = { studentId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const weightHistory = await db.weightHistory.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    });

    const formattedHistory = weightHistory.map((wh) => ({
      date: wh.date,
      weight: wh.weight,
      notes: wh.notes || undefined,
    }));

    const total = await db.weightHistory.count({ where });

    return successResponse(set, {
      history: formattedHistory,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[getWeightHistoryFilteredHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar histórico", error);
  }
}

export async function getStudentProgressHandler({
  set,
  studentId,
}: StudentContext) {
  try {
    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    });

    if (!progress) {
      return successResponse(set, {
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
      });
    }

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
      weeklyXP[dayOfWeek] += wh.workout?.xpReward || 0;
    });

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

    let calculatedStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (workoutDays.has(dateStr)) {
        calculatedStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (calculatedStreak !== (progress.currentStreak || 0)) {
      const longestStreak = Math.max(
        calculatedStreak,
        progress.longestStreak || 0
      );

      await db.studentProgress.update({
        where: { studentId },
        data: {
          currentStreak: calculatedStreak,
          longestStreak,
        },
      });
    }

    return successResponse(set, {
      currentStreak: calculatedStreak,
      longestStreak: Math.max(calculatedStreak, progress.longestStreak || 0),
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
    });
  } catch (error) {
    console.error("[getStudentProgressHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar progresso", error);
  }
}

export async function updateStudentProgressHandler({
  set,
  body,
  studentId,
}: StudentContext) {
  try {
    const validation = validateBody(body, updateStudentProgressSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors }
      );
    }

    const data = validation.data as any;
    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    });

    if (!progress) {
      await db.studentProgress.create({
        data: {
          studentId,
          ...data,
        },
      });
    } else {
      await db.studentProgress.update({
        where: { studentId },
        data: {
          ...data,
          lastActivityDate: data.lastActivityDate
            ? new Date(data.lastActivityDate)
            : undefined,
        },
      });
    }

    return successResponse(set, {
      message: "Progresso atualizado com sucesso",
    });
  } catch (error) {
    console.error("[updateStudentProgressHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao atualizar progresso", error);
  }
}

export async function getStudentInfoHandler({ set, studentId }: StudentContext) {
  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        age: true,
        gender: true,
        phone: true,
        avatar: true,
        isTrans: true,
        usesHormones: true,
        hormoneType: true,
      },
    });

    if (!student) {
      return successResponse(set, {
        id: studentId,
        age: null,
        gender: null,
        phone: null,
        avatar: null,
      });
    }

    return successResponse(set, {
      id: student.id,
      age: student.age,
      gender: student.gender,
      phone: student.phone,
      avatar: student.avatar,
      isTrans: student.isTrans ?? false,
      usesHormones: student.usesHormones ?? false,
      hormoneType: student.hormoneType || null,
    });
  } catch (error) {
    console.error("[getStudentInfoHandler] Erro:", error);
    return internalErrorResponse(
      set,
      "Erro ao buscar informações do student",
      error
    );
  }
}

export async function getPersonalRecordsHandler({
  set,
  studentId,
}: StudentContext) {
  try {
    const personalRecords = await db.personalRecord.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 50,
    });

    const formattedRecords = personalRecords.map((pr) => ({
      exerciseId: pr.exerciseId,
      exerciseName: pr.exerciseName,
      type: pr.type as "max-weight" | "max-reps" | "max-volume",
      value: pr.value,
      date: pr.date,
      previousBest: pr.previousBest || undefined,
    }));

    return successResponse(set, {
      records: formattedRecords,
      total: formattedRecords.length,
    });
  } catch (error) {
    console.error("[getPersonalRecordsHandler] Erro:", error);
    return internalErrorResponse(
      set,
      "Erro ao buscar personal records",
      error
    );
  }
}

export async function getDayPassesHandler({ set, studentId }: StudentContext) {
  try {
    const dayPasses = await db.dayPass.findMany({
      where: { studentId },
      orderBy: { purchaseDate: "desc" },
      take: 50,
    });

    const formattedDayPasses = dayPasses.map((dp) => ({
      id: dp.id,
      gymId: dp.gymId,
      gymName: dp.gymName,
      purchaseDate: dp.purchaseDate,
      validDate: dp.validDate,
      price: dp.price,
      status: dp.status,
      qrCode: dp.qrCode || undefined,
    }));

    return successResponse(set, {
      dayPasses: formattedDayPasses,
      total: formattedDayPasses.length,
    });
  } catch (error) {
    console.error("[getDayPassesHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar day passes", error);
  }
}

export async function getFriendsHandler({ set, studentId }: StudentContext) {
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

    const friends = {
      count: friendships.length,
      list: friendships.map((f) => ({
        id: f.friend.id,
        name: f.friend.user.name,
        avatar: f.friend.user.image || undefined,
        username: undefined,
      })),
    };

    return successResponse(set, friends);
  } catch (error) {
    console.error("[getFriendsHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar amigos", error);
  }
}

type AllStudentDataOptions = {
  studentId: string;
  userId: string;
  sections?: string[];
};

async function getAllStudentDataForUser({
  studentId,
  userId,
  sections,
}: AllStudentDataOptions) {
  try {
    const requestedSections = sections
      ? sections.filter((s) => s !== "actions" && s !== "loaders")
      : null;

    const result: any = {};

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

    if (!requestedSections || requestedSections.includes("progress")) {
      const progress = await db.studentProgress.findUnique({
        where: { studentId },
      });

      if (progress) {
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
          weeklyXP[dayOfWeek] += wh.workout?.xpReward || 0;
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
        if (error.code === "P2021" || error.message?.includes("does not exist")) {
          result.weightHistory = mockWeightHistory;
        }
      }
    }

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

            let isLocked = workout.locked;
            const workoutIndex = unit.workouts.findIndex((w) => w.id === workout.id);
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
              stars,
              completedAt: lastCompletion?.date || undefined,
            };
          }),
        }));
      } catch (error) {
        console.error("Erro ao buscar units:", error);
        result.units = mockUnits;
      }
    }

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
            } catch {}
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
          } catch {}
        }

        return {
          date: wh.date,
          workoutId: wh.workoutId,
          workoutName: wh.workout?.title || "Treino",
          duration: wh.duration,
          totalVolume: wh.totalVolume || calculatedVolume,
          exercises: wh.exercises.map((el) => {
            let sets: any[] = [];
            try {
              sets = JSON.parse(el.sets);
            } catch {}

            return {
              id: el.id,
              exerciseId: el.exerciseId,
              exerciseName: el.exerciseName,
              workoutId: wh.workoutId,
              date: wh.date,
              sets,
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
          bodyPartsFatigued,
        };
      });
    }

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

    if (!requestedSections || requestedSections.includes("dailyNutrition")) {
      try {
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
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

        const dailyNutrition = await db.dailyNutrition.findFirst({
          where: {
            studentId,
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
        if (error.code === "P2021" || error.message?.includes("does not exist")) {
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
      } catch {
        result.memberships = [];
      }
    }

    if (!requestedSections || requestedSections.includes("payments")) {
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
      } catch {
        result.payments = [];
      }
    }

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
      } catch {
        result.paymentMethods = [];
      }
    }

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
      } catch {
        result.dayPasses = [];
      }
    }

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
            } catch {}
          }

          let openingHours: any = null;
          if (gym.openingHours) {
            try {
              openingHours = JSON.parse(gym.openingHours);
            } catch {}
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
            amenities,
            openNow,
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
      } catch {
        result.gymLocations = mockGymLocations;
      }
    }

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
            username: undefined,
          })),
        };
      } catch {
        result.friends = {
          count: 0,
          list: [],
        };
      }
    }

    if (!requestedSections || requestedSections.includes("foodDatabase")) {
      result.foodDatabase = [];
    }

    return result;
  } catch (error) {
    console.error("[getAllStudentData] Erro:", error);
    return getMockData();
  }
}

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
