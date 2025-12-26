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

    // Ler query params
    const { searchParams } = new URL(request.url);
    const sectionsParam = searchParams.get("sections");

    // Parse sections se fornecido
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
    const data = await request.json();

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
        },
      });
    } else {
      student = await db.student.update({
        where: { id: student.id },
        data: {
          age: data.age,
          gender: data.gender,
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

    // Ler query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    // Ler dados do body
    const body = await request.json();
    const { weight, date, notes } = body;

    // Validar dados
    if (!weight || typeof weight !== "number" || weight <= 0) {
      return badRequestResponse(
        "Peso inválido. Deve ser um número maior que zero."
      );
    }

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

    // Ler query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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
