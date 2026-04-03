/**
 * Utilitarios de tratamento de erros.
 */

import { log } from "@/lib/observability";
import { errorResponse, internalErrorResponse } from "./response.utils";

export function handleApiError(
  error: Error & {
    code?: string;
    name?: string;
    errors?: Array<{ path?: string[]; message?: string }>;
  },
  context: string,
  defaultMessage: string = "Erro ao processar requisicao",
): Response {
  log.error(`[${context}] Erro`, {
    error: error.message,
    code: error.code,
    name: error.name,
  });

  if (error.code === "P2002") {
    return errorResponse("Registro duplicado", 400);
  }

  if (error.code === "P2025") {
    return errorResponse("Registro nao encontrado", 404);
  }

  if (error.name === "ValidationError" || error.name === "ZodError") {
    return errorResponse(error.message || "Dados invalidos", 400, error.errors);
  }

  return internalErrorResponse(
    defaultMessage,
    process.env.NODE_ENV === "development" ? error : undefined,
  );
}

export function withErrorHandling(
  handler: (request: Request, context?: string) => Promise<Response>,
  context: string,
) {
  return async (request: Request, ctx?: string): Promise<Response> => {
    try {
      return await handler(request, ctx ?? context);
    } catch (error) {
      return handleApiError(
        error as Error & {
          code?: string;
          name?: string;
          errors?: Array<{ path?: string[]; message?: string }>;
        },
        context,
      );
    }
  };
}
