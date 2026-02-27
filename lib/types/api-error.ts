/**
 * Tipos para erros de API e valores genéricos.
 * Evita uso de any e unknown com tipos explícitos.
 */

/** Erro típico de resposta HTTP (axios, fetch) */
export interface ApiError {
	message?: string;
	code?: string;
	response?: {
		status?: number;
		data?: {
			error?: string;
			code?: string;
			details?: Record<string, string | number | boolean | string[]>;
		};
	};
}

/** Valor JSON válido (sem any/unknown) */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

/** Valor que pode ser convertido para data (date-safe, etc) */
export type DateLike = string | number | Date | null | object;
