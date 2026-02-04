/**
 * Utilitários de Tratamento de Erros
 *
 * Centraliza o tratamento e logging de erros
 */

import { errorResponse, internalErrorResponse } from "./response.utils";

/**
 * Trata erros da API de forma padronizada
 */
export function handleApiError(
	error: any,
	context: string,
	defaultMessage: string = "Erro ao processar requisição",
): Response {
	console.error(`[${context}] Erro:`, error);

	// Erros conhecidos do Prisma
	if (error.code === "P2002") {
		return errorResponse("Registro duplicado", 400).toResponse();
	}

	if (error.code === "P2025") {
		return errorResponse("Registro não encontrado", 404).toResponse();
	}

	// Erro de validação
	if (error.name === "ValidationError" || error.name === "ZodError") {
		return errorResponse(
			error.message || "Dados inválidos",
			400,
			error.errors,
		).toResponse();
	}

	// Erro genérico
	return internalErrorResponse(
		defaultMessage,
		process.env.NODE_ENV === "development" ? error : undefined,
	).toResponse();
}

/**
 * Wrapper para handlers que trata erros automaticamente
 */
export function withErrorHandling(
	handler: (request: any, context?: any) => Promise<Response>,
	_context: string,
) {
	return async (request: any, context?: any): Promise<Response> => {
		try {
			return await handler(request, context);
		} catch (error: any) {
			return handleApiError(error, context);
		}
	};
}
