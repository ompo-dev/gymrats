import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
} from "@/lib/api/utils/response.utils";
import {
  getNutritionAccessErrorMessage,
  isNutritionAccessError,
} from "./nutrition-access.service";
import {
  getNutritionLibraryErrorMessage,
  isNutritionLibraryError,
} from "./nutrition-plan.service";

export function mapNutritionRouteError(
  error: unknown,
  fallbackMessage: string,
) {
  if (
    isNutritionLibraryError(error, "NUTRITION_PLAN_NOT_FOUND") ||
    isNutritionLibraryError(error, "NUTRITION_LIBRARY_PLAN_NOT_FOUND") ||
    isNutritionAccessError(error, "NUTRITION_PLAN_NOT_FOUND")
  ) {
    const message = isNutritionAccessError(error, "NUTRITION_PLAN_NOT_FOUND")
      ? getNutritionAccessErrorMessage(error)
      : getNutritionLibraryErrorMessage(error);
    return notFoundResponse(message);
  }

  if (
    isNutritionLibraryError(error, "LIBRARY_PLAN_LIMIT_REACHED") ||
    isNutritionLibraryError(error, "PAST_DATE_READ_ONLY") ||
    isNutritionAccessError(error, "NUTRITION_PLAN_NOT_LIBRARY")
  ) {
    const message = isNutritionAccessError(error, "NUTRITION_PLAN_NOT_LIBRARY")
      ? getNutritionAccessErrorMessage(error)
      : getNutritionLibraryErrorMessage(error);
    return badRequestResponse(message);
  }

  if (
    isNutritionLibraryError(error, "NUTRITION_LIBRARY_PLAN_FORBIDDEN") ||
    isNutritionAccessError(error, "NUTRITION_PLAN_FORBIDDEN") ||
    isNutritionAccessError(error, "STUDENT_ACCESS_FORBIDDEN")
  ) {
    const message =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (isNutritionAccessError(error, "NUTRITION_PLAN_FORBIDDEN") ||
        isNutritionAccessError(error, "STUDENT_ACCESS_FORBIDDEN"))
        ? getNutritionAccessErrorMessage(error)
        : getNutritionLibraryErrorMessage(error);

    return forbiddenResponse(message);
  }

  return internalErrorResponse(fallbackMessage, error);
}
