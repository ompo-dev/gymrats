/**
 * Utilitários seguros para parse de JSON em campos do banco
 */
export function parseJsonSafe<T>(value: string | null | undefined): T | null {
	if (value == null || value === "") return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

export function parseJsonArray<T>(value: string | null | undefined): T[] {
	const parsed = parseJsonSafe<T[]>(value);
	return Array.isArray(parsed) ? parsed : [];
}
