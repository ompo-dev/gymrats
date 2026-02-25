export function toValidDate(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	return null;
}

export function getTimeMs(value: unknown): number | null {
	const date = toValidDate(value);
	return date ? date.getTime() : null;
}

export function formatDatePtBr(value: unknown): string | null {
	const date = toValidDate(value);
	return date ? date.toLocaleDateString("pt-BR") : null;
}
