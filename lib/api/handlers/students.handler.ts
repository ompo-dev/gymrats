/**
 * Handler de Students
 *
 * Centraliza toda a lógica das rotas relacionadas a students
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStudent } from "../middleware/auth.middleware";
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from "../utils/response.utils";
import { getAllStudentData } from "@/app/student/actions-unified";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import type { MuscleGroup } from "@/lib/types";
import {
  updateStudentProfileSchema,
  addWeightSchema,
  weightHistoryQuerySchema,
  studentSectionsQuerySchema,
} from "../schemas";
import { validateBody, validateQuery } from "../middleware/validation.middleware";

/**
 * GET /api/students/all
 * Retorna todos os dados do student ou seções específicas
 */
export async function getAllStudentDataHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    // Validar query params com Zod
    const queryValidation = await validateQuery(request, studentSectionsQuerySchema);
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const sectionsParam = queryValidation.data.sections;
    let sections: string[] | undefined = undefined;
    if (sectionsParam) {
      sections = sectionsParam.split(",").map((s) => s.trim());
    }

    // Buscar dados
    const data = await getAllStudentData(sections);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("[getAllStudentDataHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar dados do student", error);
  }
}

/**
 * GET /api/students/profile
 * Verifica se o student tem perfil completo
 */
export async function getStudentProfileHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;

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
      return successResponse({
        hasProfile: false,
      });
    }

    const hasProfile =
      !!user.student.profile &&
      user.student.profile.height !== null &&
      user.student.profile.weight !== null &&
      user.student.profile.fitnessLevel !== null;

    return successResponse({
      hasProfile,
      // Incluir informações do Student também (isTrans, usesHormones, hormoneType)
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
            weeklyWorkoutFrequency: user.student.profile.weeklyWorkoutFrequency,
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
            // Valores metabólicos
            bmr: user.student.profile.bmr,
            tdee: user.student.profile.tdee,
            targetCalories: user.student.profile.targetCalories,
            targetProtein: user.student.profile.targetProtein,
            targetCarbs: user.student.profile.targetCarbs,
            targetFats: user.student.profile.targetFats,
            // Nível de atividade e tratamento hormonal
            activityLevel: user.student.profile.activityLevel,
            hormoneTreatmentDuration: user.student.profile.hormoneTreatmentDuration,
            // Limitações
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
            // Horas disponíveis por dia para treino
            dailyAvailableHours: user.student.profile.dailyAvailableHours,
            // Manter compatibilidade com campo antigo
            injuries: user.student.profile.injuries
              ? JSON.parse(user.student.profile.injuries)
              : [],
          }
        : null,
    });
  } catch (error: any) {
    console.error("[getStudentProfileHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar perfil", error);
  }
}

/**
 * POST /api/students/profile
 * Cria ou atualiza o perfil do student
 */
export async function updateStudentProfileHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const userId = auth.userId;
    
    // Validar body com Zod
    const validation = await validateBody(request, updateStudentProfileSchema);
    if (!validation.success) {
      return validation.response;
    }
    
    const data = validation.data;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!user) {
      return badRequestResponse("Usuário não encontrado");
    }

    if (user.role !== "STUDENT") {
      return badRequestResponse("Usuário não é um aluno");
    }

    let student = user.student;
    if (!student) {
      student = await db.student.create({
        data: {
          userId,
          age: data.age,
          gender: data.gender,
          // Informações sobre identidade de gênero e terapia hormonal
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
          // Informações sobre identidade de gênero e terapia hormonal
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
      // Valores metabólicos calculados
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
      // Nível de atividade física (1-10)
      activityLevel: data.activityLevel
        ? parseInt(String(data.activityLevel))
        : null,
      // Tempo de tratamento hormonal (meses)
      hormoneTreatmentDuration: data.hormoneTreatmentDuration
        ? parseInt(String(data.hormoneTreatmentDuration))
        : null,
      // Limitações separadas
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
      // Detalhes das limitações
      limitationDetails:
        data.limitationDetails && typeof data.limitationDetails === "object"
          ? JSON.stringify(data.limitationDetails)
          : null,
      // Horas disponíveis por dia para treino
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

    // Verificar se já existe progress
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

    // Inicializar trial de 14 dias automaticamente
    await initializeStudentTrial(student.id);

    return successResponse({
      message: "Perfil salvo com sucesso",
    });
  } catch (error: any) {
    console.error("[updateStudentProfileHandler] Erro:", error);
    return internalErrorResponse("Erro ao salvar perfil", error);
  }
}

/**
 * GET /api/students/weight
 * Busca histórico de peso com paginação
 */
export async function getWeightHistoryHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    // Validar query params com Zod
    const queryValidation = await validateQuery(request, weightHistoryQuerySchema);
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const limit = queryValidation.data.limit || 30;
    const offset = queryValidation.data.offset || 0;

    // Buscar histórico de peso
    const weightHistory = await db.weightHistory.findMany({
      where: {
        studentId: studentId,
      },
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transformar para formato esperado
    const formattedHistory = weightHistory.map((wh) => ({
      date: wh.date,
      weight: wh.weight,
      notes: wh.notes || undefined,
    }));

    // Contar total de registros
    const total = await db.weightHistory.count({
      where: {
        studentId: studentId,
      },
    });

    return successResponse({
      history: formattedHistory,
      total: total,
      limit: limit,
      offset: offset,
    });
  } catch (error: any) {
    console.error("[getWeightHistoryHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar histórico", error);
  }
}

/**
 * POST /api/students/weight
 * Adiciona uma nova entrada de peso
 */
export async function addWeightHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    // Validar body com Zod
    const validation = await validateBody(request, addWeightSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { weight, date, notes } = validation.data;

    // Criar entrada de peso
    const weightEntry = await db.weightHistory.create({
      data: {
        studentId: studentId,
        weight: weight,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    });

    // Atualizar peso atual no StudentProfile
    await db.studentProfile.update({
      where: { studentId: studentId },
      data: { weight: weight },
    });

    return successResponse({
      weightEntry: {
        id: weightEntry.id,
        weight: weightEntry.weight,
        date: weightEntry.date,
        notes: weightEntry.notes,
      },
    });
  } catch (error: any) {
    console.error("[addWeightHandler] Erro:", error);
    return internalErrorResponse("Erro ao salvar peso", error);
  }
}

/**
 * GET /api/students/weight-history
 * Busca histórico de peso com filtros de data
 */
export async function getWeightHistoryFilteredHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    // Validar query params com Zod
    const queryValidation = await validateQuery(request, weightHistoryQuerySchema);
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const limit = queryValidation.data.limit || 30;
    const offset = queryValidation.data.offset || 0;
    const startDate = queryValidation.data.startDate;
    const endDate = queryValidation.data.endDate;

    // Construir filtros
    const where: any = {
      studentId: studentId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Buscar histórico de peso
    const weightHistory = await db.weightHistory.findMany({
      where: where,
      orderBy: {
        date: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transformar para formato esperado
    const formattedHistory = weightHistory.map((wh) => ({
      date: wh.date,
      weight: wh.weight,
      notes: wh.notes || undefined,
    }));

    // Contar total de registros
    const total = await db.weightHistory.count({
      where: where,
    });

    return successResponse({
      history: formattedHistory,
      total: total,
      limit: limit,
      offset: offset,
    });
  } catch (error: any) {
    console.error("[getWeightHistoryFilteredHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar histórico", error);
  }
}

/**
 * GET /api/students/progress
 * Busca progresso do student (XP, streaks, achievements, etc.)
 */
export async function getStudentProgressHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    });

    if (!progress) {
      return successResponse({
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

    return successResponse({
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
    });
  } catch (error: any) {
    console.error("[getStudentProgressHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar progresso", error);
  }
}

/**
 * GET /api/students/student
 * Busca informações básicas do student
 */
export async function getStudentInfoHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        age: true,
        gender: true,
        phone: true,
        avatar: true,
        // Informações sobre identidade de gênero e terapia hormonal
        isTrans: true,
        usesHormones: true,
        hormoneType: true,
      },
    });

    if (!student) {
      return successResponse({
        id: studentId,
        age: null,
        gender: null,
        phone: null,
        avatar: null,
      });
    }

    return successResponse({
      id: student.id,
      age: student.age,
      gender: student.gender,
      phone: student.phone,
      avatar: student.avatar,
      isTrans: student.isTrans ?? false,
      usesHormones: student.usesHormones ?? false,
      hormoneType: student.hormoneType || null,
    });
  } catch (error: any) {
    console.error("[getStudentInfoHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar informações do student", error);
  }
}

/**
 * GET /api/students/personal-records
 * Busca personal records do student
 */
export async function getPersonalRecordsHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

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

    return successResponse({
      records: formattedRecords,
      total: formattedRecords.length,
    });
  } catch (error: any) {
    console.error("[getPersonalRecordsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar personal records", error);
  }
}

/**
 * GET /api/students/day-passes
 * Busca day passes do student
 */
export async function getDayPassesHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

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

    return successResponse({
      dayPasses: formattedDayPasses,
      total: formattedDayPasses.length,
    });
  } catch (error: any) {
    console.error("[getDayPassesHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar day passes", error);
  }
}

/**
 * GET /api/students/friends
 * Busca amigos do student
 */
export async function getFriendsHandler(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student.id;

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
        username: undefined, // Pode ser adicionado depois
      })),
    };

    return successResponse(friends);
  } catch (error: any) {
    console.error("[getFriendsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar amigos", error);
  }
}
