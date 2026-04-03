import type { Context } from "elysia";
import type { z } from "zod";
import {
  addWeightSchema,
  updateStudentProfileSchema,
  updateStudentProgressSchema,
  weightHistoryQuerySchema,
} from "@/lib/api/schemas";
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
import { log } from "@/lib/observability";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type StudentContext = {
  set: Context["set"];
  body?: Record<string, string | number | boolean | object | null>;
  query?: Record<string, import("@/lib/types/api-error").JsonValue>;
  studentId: string;
  userId: string;
};

export async function getStudentProfileHandler({
  set,
  userId,
}: StudentContext) {
  try {
    const result = await getStudentProfileUseCase({ userId });
    return successResponse(set, {
      hasProfile: result.hasProfile,
      student: result.student,
      profile: result.profile
        ? {
            ...result.profile,
            // garantir compatibilidade com o antigo formatProfileResponse
            goals: result.profile.goals,
            availableEquipment: result.profile.availableEquipment,
            physicalLimitations: result.profile.physicalLimitations,
            motorLimitations: result.profile.motorLimitations,
            medicalConditions: result.profile.medicalConditions,
            limitationDetails: result.profile.limitationDetails,
            injuries: result.profile.injuries,
          }
        : null,
    });
  } catch (error) {
    log.error("[getStudentProfileHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(set, "Erro ao buscar perfil", error);
  }
}

export async function updateStudentProfileHandler({
  set,
  body,
  userId,
}: StudentContext) {
  try {
    const validation = validateBody(body, updateStudentProfileSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    await updateStudentProfileUseCase({
      userId,
      data: validation.data as z.infer<typeof updateStudentProfileSchema>,
    });

    return successResponse(set, { message: "Perfil salvo com sucesso" });
  } catch (error) {
    log.error("[updateStudentProfileHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error) {
      if (error.message === "Usuário não encontrado")
        return badRequestResponse(set, "Usuário não encontrado");
      if (error.message === "Usuário não é um aluno")
        return badRequestResponse(set, "Usuário não é um aluno");
    }
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
      (query || {}) as Record<
        string,
        import("@/lib/types/api-error").JsonValue
      >,
      weightHistoryQuerySchema,
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors },
      );
    }

    const result = await getWeightHistoryUseCase({
      studentId,
      limit: queryValidation.data.limit || 30,
      offset: queryValidation.data.offset || 0,
    });

    return successResponse(set, result);
  } catch (error) {
    log.error("[getWeightHistoryHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(set, "Erro ao buscar histórico", error);
  }
}

export async function addWeightHandler({
  set,
  body,
  studentId,
}: StudentContext) {
  try {
    const validation = validateBody(body, addWeightSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    const { weight, date, notes } = validation.data as {
      weight: number;
      date?: string;
      notes?: string;
    };

    const result = await addWeightUseCase({ studentId, weight, date, notes });
    return successResponse(set, result);
  } catch (error) {
    log.error("[addWeightHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
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
      (query || {}) as Record<
        string,
        import("@/lib/types/api-error").JsonValue
      >,
      weightHistoryQuerySchema,
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors },
      );
    }

    const result = await getWeightHistoryUseCase({
      studentId,
      limit: queryValidation.data.limit || 30,
      offset: queryValidation.data.offset || 0,
      startDate: queryValidation.data.startDate as string | undefined,
      endDate: queryValidation.data.endDate as string | undefined,
    });

    return successResponse(set, result);
  } catch (error) {
    log.error("[getWeightHistoryFilteredHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(set, "Erro ao buscar histórico", error);
  }
}

export async function getStudentProgressHandler({
  set,
  studentId,
}: StudentContext) {
  try {
    const result = await getStudentProgressUseCase({ studentId });
    return successResponse(set, result);
  } catch (error) {
    log.error("[getStudentProgressHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
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
        { errors: validation.errors },
      );
    }

    await updateStudentProgressUseCase({
      studentId,
      data: validation.data as z.infer<typeof updateStudentProgressSchema>,
    });

    return successResponse(set, {
      message: "Progresso atualizado com sucesso",
    });
  } catch (error) {
    log.error("[updateStudentProgressHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(set, "Erro ao atualizar progresso", error);
  }
}

export async function getStudentInfoHandler({
  set,
  studentId,
}: StudentContext) {
  try {
    const result = await getStudentInfoUseCase({ studentId });
    return successResponse(set, result);
  } catch (error) {
    log.error("[getStudentInfoHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(
      set,
      "Erro ao buscar informações do student",
      error,
    );
  }
}

export async function getPersonalRecordsHandler({
  set,
  studentId,
}: StudentContext) {
  try {
    const result = await getPersonalRecordsUseCase({ studentId });
    return successResponse(set, result);
  } catch (error) {
    log.error("[getPersonalRecordsHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(set, "Erro ao buscar personal records", error);
  }
}

export async function getDayPassesHandler({ set, studentId }: StudentContext) {
  try {
    const result = await getDayPassesUseCase({ studentId });
    return successResponse(set, result);
  } catch (error) {
    log.error("[getDayPassesHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(set, "Erro ao buscar day passes", error);
  }
}

export async function getFriendsHandler({ set, studentId }: StudentContext) {
  try {
    const result = await getFriendsUseCase({ studentId });
    return successResponse(set, result);
  } catch (error) {
    log.error("[getFriendsHandler] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(set, "Erro ao buscar amigos", error);
  }
}
