import { ZodError, type ZodSchema, type ZodType } from "zod";
import type { NextRequest, NextResponse } from "@/runtime/next-server";
import { badRequestResponse } from "../utils/response.utils";

/**
 * Middleware de validacao usando Zod
 *
 * Valida o body, query params ou path params de uma requisicao
 */

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Valida os dados da requisicao usando schemas Zod
 *
 * @param request - Requisicao Next.js
 * @param options - Opcoes de validacao (body, query, params)
 * @returns Objeto com dados validados ou resposta de erro
 */
export async function validateRequest<
  T = Record<string, string | number | boolean | object>,
>(
  request: NextRequest,
  options: ValidationOptions,
): Promise<
  { success: true; data: T } | { success: false; response: NextResponse }
> {
  const errors: string[] = [];
  const validatedData: Record<string, string | number | boolean | object> = {};

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
        errors.push("Erro ao validar body da requisicao");
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

  // Path params continuam sendo validados no handler por enquanto.
  if (options.params) {
    void options.params;
  }

  if (errors.length > 0) {
    return {
      success: false,
      response: badRequestResponse(`Erros de validacao: ${errors.join("; ")}`, {
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
 * IMPORTANTE: Esta funcao le o body, entao nao pode ser chamada duas vezes na mesma requisicao
 * Usa ZodType<T, ZodTypeDef, unknown> para aceitar schemas com transform (input diferente do output)
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodType<T, import("zod").ZodTypeDef, unknown>,
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
 * Usa ZodType<T, ZodTypeDef, unknown> para aceitar schemas com transform (query vem como string)
 */
export async function validateQuery<T>(
  request: NextRequest,
  schema: ZodType<T, import("zod").ZodTypeDef, unknown>,
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
