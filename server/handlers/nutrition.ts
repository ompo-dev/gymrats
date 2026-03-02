import type { Context } from "elysia";
import {
  dailyNutritionQuerySchema,
  dailyNutritionUpdateSchema,
  foodSearchQuerySchema,
} from "@/lib/api/schemas/nutrition.schemas";
import { db } from "@/lib/db";
import { getDailyNutritionUseCase } from "@/lib/use-cases/nutrition/get-daily-nutrition";
import { searchFoodsUseCase } from "@/lib/use-cases/nutrition/search-foods";
import { updateDailyNutritionUseCase } from "@/lib/use-cases/nutrition/update-daily-nutrition";
import {
  badRequestResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type NutritionContext = {
  set: Context["set"];
  query?: Record<string, import("@/lib/types/api-error").JsonValue>;
  body?: Record<string, string | number | boolean | object | null>;
  studentId: string;
};

export async function getDailyNutritionHandler({
  set,
  query,
  studentId,
}: NutritionContext) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<
        string,
        import("@/lib/types/api-error").JsonValue
      >,
      dailyNutritionQuerySchema,
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors },
      );
    }

    const result = await getDailyNutritionUseCase({
      studentId,
      date: queryValidation.data.date as string | undefined,
    });

    return successResponse(set, result);
  } catch (error) {
    console.error("[getDailyNutritionHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar nutrição diária", error);
  }
}

export async function updateDailyNutritionHandler({
  set,
  body,
  studentId,
}: NutritionContext) {
  try {
    const validation = validateBody(body, dailyNutritionUpdateSchema);
    if (!validation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${validation.errors.join("; ")}`,
        { errors: validation.errors },
      );
    }

    const { date, meals, waterIntake } = validation.data as {
      date?: string;
      waterIntake?: number;
      meals?: import("@/lib/use-cases/nutrition/update-daily-nutrition").NutritionMealInput[];
    };

    await updateDailyNutritionUseCase({ studentId, date, waterIntake, meals });
    return successResponse(set, { message: "Nutrição diária atualizada" });
  } catch (error) {
    console.error("[updateDailyNutritionHandler] Erro:", error);
    return internalErrorResponse(
      set,
      "Erro ao atualizar nutrição diária",
      error,
    );
  }
}

export async function searchFoodsHandler({
  set,
  query,
}: {
  set: NutritionContext["set"];
  query?: Record<string, import("@/lib/types/api-error").JsonValue>;
}) {
  try {
    const queryValidation = validateQuery(
      (query || {}) as Record<
        string,
        import("@/lib/types/api-error").JsonValue
      >,
      foodSearchQuerySchema,
    );
    if (!queryValidation.success) {
      return badRequestResponse(
        set,
        `Erros de validação: ${queryValidation.errors.join("; ")}`,
        { errors: queryValidation.errors },
      );
    }

    const { q, category, limit } = queryValidation.data as {
      q?: string;
      category?: string;
      limit?: number;
    };

    const result = await searchFoodsUseCase({ q, category, limit });
    return successResponse(set, result);
  } catch (error) {
    console.error("[searchFoodsHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar alimentos", error);
  }
}

export async function getFoodByIdHandler({
  set,
  params,
}: {
  set: NutritionContext["set"];
  params?: Record<string, string>;
}) {
  try {
    const id = params?.id;
    if (!id) return badRequestResponse(set, "ID do alimento é obrigatório");

    const food = await db.foodItem.findUnique({ where: { id } });
    if (!food) return notFoundResponse(set, "Alimento não encontrado");

    return successResponse(set, { food });
  } catch (error) {
    console.error("[getFoodByIdHandler] Erro:", error);
    return internalErrorResponse(set, "Erro ao buscar alimento", error);
  }
}
