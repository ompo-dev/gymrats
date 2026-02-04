/**
 * Utilitários de Resposta HTTP
 *
 * Padroniza as respostas da API
 */

import { NextResponse } from "next/server";

/**
 * Resposta de sucesso
 */
export function successResponse(
	data: any,
	status: number = 200,
	headers?: Record<string, string>,
): NextResponse {
	return NextResponse.json(
		{ success: true, ...data },
		{
			status,
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
		},
	);
}

/**
 * Resposta de erro
 */
export function errorResponse(
	message: string,
	status: number = 500,
	details?: any,
): NextResponse {
	const response: any = {
		error: message,
	};

	if (details && process.env.NODE_ENV === "development") {
		response.details = details;
	}

	return NextResponse.json(response, { status });
}

/**
 * Resposta 400 - Bad Request
 */
export function badRequestResponse(
	message: string = "Dados inválidos",
	details?: any,
): NextResponse {
	return errorResponse(message, 400, details);
}

/**
 * Resposta 401 - Unauthorized
 */
export function unauthorizedResponse(
	message: string = "Não autenticado",
): NextResponse {
	return errorResponse(message, 401);
}

/**
 * Resposta 403 - Forbidden
 */
export function forbiddenResponse(
	message: string = "Acesso negado",
): NextResponse {
	return errorResponse(message, 403);
}

/**
 * Resposta 404 - Not Found
 */
export function notFoundResponse(
	message: string = "Recurso não encontrado",
): NextResponse {
	return errorResponse(message, 404);
}

/**
 * Resposta 500 - Internal Server Error
 */
export function internalErrorResponse(
	message: string = "Erro interno do servidor",
	error?: any,
): NextResponse {
	console.error("[API Error]:", error);
	return errorResponse(message, 500, error?.message);
}
