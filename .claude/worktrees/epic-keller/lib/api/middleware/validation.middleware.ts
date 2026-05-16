import type { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { badRequestResponse } from "../utils/response.utils";

/**
 * Middleware de validação usando Zod
 *
 * Valida o body, query params ou path params de uma requisição
 */

export interface ValidationOptions {
	body?: ZodSchema;
	query?: ZodSchema;
	params?: ZodSchema;
}

/**
 * Valida os dados da requisição usando schemas Zod
 *
 * @param request - Requisição Next.js
 * @param options - Opções de validação (body, query, params)
 * @returns Objeto com dados validados ou resposta de erro
 */
export async function validateRequest<T = any>(
	request: NextRequest,
	options: ValidationOptions,
): Promise<
	{ success: true; data: T } | { success: false; response: NextResponse }
> {
	const errors: string[] = [];
	const validatedData: any = {};

	// Validar body se fornecido
	if (options.body) {
		try {
			const body = await request.json();
			const validatedBody = options.body.parse(body);
			validatedData.body = validatedBody;
		} catch (error) {
			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map(
					(err) => `${err.path.join(".")}: ${err.message}`,
				);
				errors.push(...formattedErrors);
			} else {
				errors.push("Erro ao validar body da requisição");
			}
		}
	}

	// Validar query params se fornecido
	if (options.query) {
		try {
			const { searchParams } = new URL(request.url);
			const queryObject: Record<string, string> = {};
			searchParams.forEach((value, key) => {
				queryObject[key] = value;
			});
			const validatedQuery = options.query.parse(queryObject);
			validatedData.query = validatedQuery;
		} catch (error) {
			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map(
					(err) => `query.${err.path.join(".")}: ${err.message}`,
				);
				errors.push(...formattedErrors);
			} else {
				errors.push("Erro ao validar query params");
			}
		}
	}

	// Validar path params se fornecido
	if (options.params) {
		try {
			// Path params precisam ser passados separadamente
			// Por enquanto, assumimos que serão validados no handler
			// Isso pode ser melhorado no futuro
		} catch (error) {
			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map(
					(err) => `params.${err.path.join(".")}: ${err.message}`,
				);
				errors.push(...formattedErrors);
			}
		}
	}

	if (errors.length > 0) {
		return {
			success: false,
			response: badRequestResponse(`Erros de validação: ${errors.join("; ")}`, {
				errors,
			}),
		};
	}

	return {
		success: true,
		data: validatedData as T,
	};
}

/**
 * Helper para validar apenas o body
 * IMPORTANTE: Esta função lê o body, então não pode ser chamada duas vezes na mesma requisição
 */
export async function validateBody<T>(
	request: NextRequest,
	schema: ZodSchema,
): Promise<
	{ success: true; data: T } | { success: false; response: NextResponse }
> {
	const result = await validateRequest<{ body: T }>(request, { body: schema });
	if (!result.success) {
		return result;
	}
	return { success: true, data: result.data.body };
}

/**
 * Helper para validar apenas query params
 */
export async function validateQuery<T>(
	request: NextRequest,
	schema: ZodSchema,
): Promise<
	{ success: true; data: T } | { success: false; response: NextResponse }
> {
	const result = await validateRequest<{ query: T }>(request, {
		query: schema,
	});
	if (!result.success) {
		return result;
	}
	return { success: true, data: result.data.query };
}

/**
 * Helper para validar body e query params
 */
export async function validateBodyAndQuery<TBody, TQuery>(
	request: NextRequest,
	bodySchema: ZodSchema,
	querySchema: ZodSchema,
): Promise<
	| { success: true; data: { body: TBody; query: TQuery } }
	| { success: false; response: NextResponse }
> {
	return validateRequest<{ body: TBody; query: TQuery }>(request, {
		body: bodySchema,
		query: querySchema,
	});
}
