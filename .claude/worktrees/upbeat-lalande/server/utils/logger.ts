/**
 * Logger estruturado para APIs.
 * Em dev: console (stderr) para visibilidade no terminal junto ao Next.js.
 * Em prod: Pino JSON para agregadores.
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	base: undefined,
	formatters: { level: (label) => ({ level: label }) },
	timestamp: pino.stdTimeFunctions.isoTime,
});

type ApiLogPayload = {
	level: "info" | "error" | "warn";
	url: string;
	method: string;
	path: string;
	query?: string;
	status?: number;
	latencyMs: number;
	requestBody?: unknown;
	responseBody?: unknown;
	userId?: string;
	studentId?: string;
	userAgent?: string;
	ip?: string;
	error?: string;
	code?: string;
};

/** stderr: visível no terminal mesmo com Next.js usando stdout */
const out = console.error.bind(console);

function writeLog(payload: ApiLogPayload) {
	queueMicrotask(() => {
		try {
			const {
				level,
				method,
				path,
				status,
				latencyMs,
				requestBody,
				responseBody,
				...rest
			} = payload;
			const head = `[API] ${method} ${path} ${status ?? "-"} ${latencyMs}ms`;
			if (isDev) {
				out(head);
				if (requestBody != null) out("  body:", JSON.stringify(requestBody));
				if (responseBody != null) out("  res:", JSON.stringify(responseBody));
				if (Object.keys(rest).length > 0) out("  ", rest);
			} else {
				if (level === "error") logger.error(payload);
				else logger.info(payload);
			}
		} catch {
			// Ignora falhas de I/O no log
		}
	});
}

const SENSITIVE_KEYS = ["password", "token", "secret", "authorization"];

function sanitizeForLog(obj: unknown): unknown {
	if (obj == null || typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map(sanitizeForLog);
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		const keyLower = k.toLowerCase();
		if (SENSITIVE_KEYS.some((s) => keyLower.includes(s))) {
			out[k] = "[REDACTED]";
		} else {
			out[k] = sanitizeForLog(v);
		}
	}
	return out;
}

export function logApiRequest(ctx: {
	request: Request;
	set?: { status?: number };
	body?: unknown;
	response?: unknown;
	_requestStart?: number;
	userId?: string;
	studentId?: string;
}) {
	const url = new URL(ctx.request.url);
	const latencyMs = ctx._requestStart ? Date.now() - ctx._requestStart : 0;
	const statusNum = ctx.set?.status;
	const payload: ApiLogPayload = {
		level: "info",
		url: ctx.request.url,
		method: ctx.request.method,
		path: url.pathname,
		query: url.search || undefined,
		status: typeof statusNum === "number" ? statusNum : undefined,
		latencyMs,
		requestBody: ctx.body != null ? sanitizeForLog(ctx.body) : undefined,
		responseBody:
			ctx.response != null ? sanitizeForLog(ctx.response) : undefined,
		userId: ctx.userId,
		studentId: ctx.studentId,
		userAgent: ctx.request.headers.get("user-agent") ?? undefined,
		ip:
			ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			ctx.request.headers.get("x-real-ip") ??
			undefined,
	};
	writeLog(payload);
}

export function logApiError(ctx: {
	request: Request;
	error?: unknown;
	code?: string | number;
	_requestStart?: number;
}) {
	const url = new URL(ctx.request.url);
	const latencyMs = ctx._requestStart ? Date.now() - ctx._requestStart : 0;
	const payload: ApiLogPayload = {
		level: "error",
		url: ctx.request.url,
		method: ctx.request.method,
		path: url.pathname,
		query: url.search || undefined,
		latencyMs,
		error: ctx.error instanceof Error ? ctx.error.message : String(ctx.error),
		code: ctx.code != null ? String(ctx.code) : undefined,
	};
	writeLog(payload);
}
