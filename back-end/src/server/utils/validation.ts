import { ZodError, type ZodType, type ZodTypeDef } from "zod";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

function formatZodErrors(prefix: string, error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.length > 0 ? err.path.join(".") : "";
    const pathPrefix = path ? `${prefix}.${path}` : prefix;
    return `${pathPrefix}: ${err.message}`;
  });
}

export function validateBody<T>(
  body: unknown,
  schema: ZodType<T, ZodTypeDef, unknown>
): ValidationResult<T> {
  try {
    const parsed = schema.parse(body);
    return { success: true, data: parsed as T };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: formatZodErrors("body", error) };
    }
    return { success: false, errors: ["Erro ao validar body da requisição"] };
  }
}

export function validateQuery<T>(
  query: Record<string, unknown>,
  schema: ZodType<T, ZodTypeDef, unknown>
): ValidationResult<T> {
  try {
    const parsed = schema.parse(query);
    return { success: true, data: parsed as T };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, errors: formatZodErrors("query", error) };
    }
    return { success: false, errors: ["Erro ao validar query params"] };
  }
}
