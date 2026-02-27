/**
 * Logger estruturado compartilhado (lib, handlers, client).
 *
 * Em dev: console com contexto JSON legível.
 * Em prod: JSON para agregadores (Pino ou similar).
 */

const isDev = typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

const SENSITIVE_KEYS = ["password", "token", "secret", "authorization", "cookie"];

function sanitize(obj: unknown): unknown {
	if (obj == null || typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map(sanitize);
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		const keyLower = k.toLowerCase();
		if (SENSITIVE_KEYS.some((s) => keyLower.includes(s))) {
			out[k] = "[REDACTED]";
		} else {
			out[k] = sanitize(v);
		}
	}
	return out;
}

function formatMessage(level: string, message: string, ctx?: Record<string, unknown>) {
	const sanitized = ctx != null ? sanitize(ctx) : undefined;
	if (isDev) {
		const parts = [`[${level}]`, message];
		if (sanitized != null && Object.keys(sanitized).length > 0) {
			parts.push(JSON.stringify(sanitized));
		}
		return parts;
	}
	return [{ level, message, ...(sanitized as object) }];
}

function write(level: "info" | "warn" | "error", fn: (...args: unknown[]) => void, message: string, ctx?: Record<string, unknown>) {
	const parts = formatMessage(level.toUpperCase(), message, ctx);
	try {
		if (isDev) {
			fn(...parts);
		} else {
			// Prod: objeto único para agregadores
			fn(parts[0]);
		}
	} catch {
		// Ignora falhas de I/O no log
	}
}

export const log = {
	info(message: string, ctx?: Record<string, unknown>) {
		write("info", console.info.bind(console), message, ctx);
	},
	warn(message: string, ctx?: Record<string, unknown>) {
		write("warn", console.warn.bind(console), message, ctx);
	},
	error(message: string, ctx?: Record<string, unknown>) {
		write("error", console.error.bind(console), message, ctx);
	},
	debug(message: string, ctx?: Record<string, unknown>) {
		if (isDev) {
			write("info", console.debug.bind(console), message, ctx);
		}
	},
};
