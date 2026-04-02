import type { Context } from "elysia";
import { log } from "@/lib/observability";

type ResponseHeaders = Record<string, string>;

export function successResponse<T>(
  set: Context["set"],
  data: T,
  status = 200,
  headers?: ResponseHeaders,
) {
  set.status = status;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      set.headers[key] = value;
    });
  }

  return { success: true, ...data } as const;
}

export function errorResponse(
  set: Context["set"],
  message: string,
  status = 500,
  details?: Record<string, string | number | boolean | object | null>,
) {
  set.status = status;
  const response: Record<string, string | number | boolean | object | null> = {
    error: message,
  };

  if (details && process.env.NODE_ENV === "development") {
    response.details = details;
  }

  return response;
}

export function badRequestResponse(
  set: Context["set"],
  message = "Dados inválidos",
  details?: Record<string, string | number | boolean | object | null>,
) {
  return errorResponse(set, message, 400, details);
}

export function unauthorizedResponse(
  set: Context["set"],
  message = "Não autenticado",
) {
  return errorResponse(set, message, 401);
}

export function forbiddenResponse(
  set: Context["set"],
  message = "Acesso negado",
) {
  return errorResponse(set, message, 403);
}

export function notFoundResponse(
  set: Context["set"],
  message = "Recurso não encontrado",
) {
  return errorResponse(set, message, 404);
}

export function internalErrorResponse(
  set: Context["set"],
  message = "Erro interno do servidor",
  error?: unknown,
) {
  log.error("[API Error]", {
    error: error instanceof Error ? error.message : String(error),
  });
  const details: Record<string, string> | undefined =
    error instanceof Error
      ? { message: error.message }
      : error && typeof error === "object" && "message" in error
        ? { message: String((error as { message?: unknown }).message ?? "") }
        : error != null
          ? { message: String(error) }
          : undefined;
  return errorResponse(set, message, 500, details);
}
