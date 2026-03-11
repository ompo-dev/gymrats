/**
 * Handler de Students
 *
 * Centraliza toda a lógica das rotas relacionadas a students
 */

import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { db } from "@/lib/db";
import { addWeightUseCase } from "@/lib/use-cases/students/add-weight";
import { getDayPassesUseCase } from "@/lib/use-cases/students/get-day-passes";
import { getFriendsUseCase } from "@/lib/use-cases/students/get-friends";
import { getPersonalRecordsUseCase } from "@/lib/use-cases/students/get-personal-records";
import { getStudentProfileUseCase } from "@/lib/use-cases/students/get-profile";
import { getStudentProgressUseCase } from "@/lib/use-cases/students/get-progress";
import { getStudentInfoUseCase } from "@/lib/use-cases/students/get-student-info";
import { getWeightHistoryUseCase } from "@/lib/use-cases/students/get-weight-history";
import { updateStudentProfileUseCase } from "@/lib/use-cases/students/update-profile";
import { updateStudentProgressUseCase } from "@/lib/use-cases/students/update-progress";
import { getNextMonday } from "@/lib/utils/week";
import { getAllStudentDataForUser } from "@/server/handlers/students";
import { requireStudent } from "../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware";
import {
  addWeightSchema,
  studentSectionsQuerySchema,
  updateStudentProfileSchema,
  updateStudentProgressSchema,
  weightHistoryQuerySchema,
} from "../schemas";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "../utils/response.utils";

/**
 * GET /api/students/all
 * Retorna todos os dados do student ou seções específicas
 */
export async function getAllStudentDataHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    // Validar query params com Zod
    const queryValidation = await validateQuery(
      request,
      studentSectionsQuerySchema,
    );
    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const sectionsParam = queryValidation.data.sections;
    let sections: string[] | undefined;
    if (sectionsParam) {
      sections = sectionsParam.split(",").map((s: string) => s.trim());
    }

    // Buscar dados
    const data = await getAllStudentDataForUser({
      studentId: auth.user.student?.id!,
      userId: auth.userId,
      sections,
    });

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[getAllStudentDataHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar dados do student", error);
  }
}

/**
 * GET /api/students/profile
 * Verifica se o student tem perfil completo
 */
export async function getStudentProfileHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const result = await getStudentProfileUseCase({ userId: auth.userId });

    return successResponse(
      result as unknown as Record<
        string,
        string | number | boolean | object | null
      >,
    );
  } catch (error) {
    console.error("[getStudentProfileHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar perfil", error);
  }
}

/**
 * POST /api/students/profile
 * Cria ou atualiza o perfil do student
 */
export async function updateStudentProfileHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const validation = await validateBody(request, updateStudentProfileSchema);
    if (!validation.success) return validation.response;

    await updateStudentProfileUseCase({
      userId: auth.userId,
      data: validation.data,
    });

    return successResponse({ message: "Perfil salvo com sucesso" });
  } catch (error) {
    console.error("[updateStudentProfileHandler] Erro:", error);
    if (error instanceof Error) {
      if (error.message === "Usuário não encontrado")
        return badRequestResponse("Usuário não encontrado");
      if (error.message === "Usuário não é um aluno")
        return badRequestResponse("Usuário não é um aluno");
    }
    return internalErrorResponse("Erro ao salvar perfil", error);
  }
}

/**
 * GET /api/students/weight
 * Busca histórico de peso com paginação
 */
export async function getWeightHistoryHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const queryValidation = await validateQuery(
      request,
      weightHistoryQuerySchema,
    );
    if (!queryValidation.success) return queryValidation.response;

    const result = await getWeightHistoryUseCase({
      studentId: auth.user.student?.id,
      limit: queryValidation.data.limit || 30,
      offset: queryValidation.data.offset || 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[getWeightHistoryHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar histórico", error);
  }
}

/**
 * POST /api/students/weight
 * Adiciona uma nova entrada de peso
 */
export async function addWeightHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const validation = await validateBody(request, addWeightSchema);
    if (!validation.success) return validation.response;

    const { weight, date, notes } = validation.data;
    const result = await addWeightUseCase({
      studentId: auth.user.student?.id,
      weight,
      date,
      notes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[addWeightHandler] Erro:", error);
    return internalErrorResponse("Erro ao salvar peso", error);
  }
}

/**
 * GET /api/students/weight-history
 * Busca histórico de peso com filtros de data
 */
export async function getWeightHistoryFilteredHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const queryValidation = await validateQuery(
      request,
      weightHistoryQuerySchema,
    );
    if (!queryValidation.success) return queryValidation.response;

    const result = await getWeightHistoryUseCase({
      studentId: auth.user.student?.id,
      limit: queryValidation.data.limit || 30,
      offset: queryValidation.data.offset || 0,
      startDate: queryValidation.data.startDate,
      endDate: queryValidation.data.endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[getWeightHistoryFilteredHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar histórico", error);
  }
}

/**
 * GET /api/students/progress
 * Busca progresso do student (XP, streaks, achievements, etc.)
 */
export async function getStudentProgressHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const result = await getStudentProgressUseCase({
      studentId: auth.user.student?.id,
    });

    return successResponse(
      result as unknown as Record<
        string,
        string | number | boolean | object | null
      >,
    );
  } catch (error) {
    console.error("[getStudentProgressHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar progresso", error);
  }
}

/**
 * PUT /api/students/progress
 * Atualiza o progresso do student
 */
export async function updateStudentProgressHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student?.id;

    // Validar body com Zod
    const validation = await validateBody(request, updateStudentProgressSchema);
    if (!validation.success) {
      return validation.response;
    }

    await updateStudentProgressUseCase({
      studentId,
      data: validation.data,
    });

    return successResponse({ message: "Progresso atualizado com sucesso" });
  } catch (error) {
    console.error("[updateStudentProgressHandler] Erro:", error);
    return internalErrorResponse("Erro ao atualizar progresso", error);
  }
}

/**
 * GET /api/students/student
 * Busca informações básicas do student
 */
export async function getStudentInfoHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const result = await getStudentInfoUseCase({
      studentId: auth.user.student?.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[getStudentInfoHandler] Erro:", error);
    return internalErrorResponse(
      "Erro ao buscar informações do student",
      error,
    );
  }
}

/**
 * GET /api/students/personal-records
 * Busca personal records do student
 */
export async function getPersonalRecordsHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const result = await getPersonalRecordsUseCase({
      studentId: auth.user.student?.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[getPersonalRecordsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar personal records", error);
  }
}

/**
 * GET /api/students/day-passes
 * Busca day passes do student
 */
export async function getDayPassesHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const result = await getDayPassesUseCase({
      studentId: auth.user.student?.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[getDayPassesHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar day passes", error);
  }
}

/**
 * GET /api/students/friends
 * Busca amigos do student
 */
export async function getFriendsHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) return auth.response;

    const result = await getFriendsUseCase({
      studentId: auth.user.student?.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[getFriendsHandler] Erro:", error);
    return internalErrorResponse("Erro ao buscar amigos", error);
  }
}

/**
 * PATCH /api/students/week-reset
 * Reset manual da semana - avança weekOverride para próxima segunda
 */
export async function weekResetHandler(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const auth = await requireStudent(request);
    if ("error" in auth) {
      return auth.response;
    }

    const studentId = auth.user.student?.id;
    const nextMonday = getNextMonday();

    await db.student.update({
      where: { id: studentId },
      data: { weekOverride: nextMonday },
    });

    return successResponse({
      message: "Semana resetada. Nodes reabilitados!",
      weekStart: nextMonday.toISOString(),
    });
  } catch (error) {
    console.error("[weekResetHandler] Erro:", error);
    return internalErrorResponse("Erro ao resetar semana");
  }
}
