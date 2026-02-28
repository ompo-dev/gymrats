/**
 * Logger estruturado para APIs (Elysia).
 * Delega para lib/observability para unificar com Next.js API routes.
 */

import { log, recordApiRequest } from "@/lib/observability";

export function logApiRequest(ctx: {
	request: Request;
	set?: { status?: number };
	body?: Record<string, string | number | boolean | object | null>;
	response?: Record<string, string | number | boolean | object | null>;
	_requestStart?: number;
	userId?: string;
	studentId?: string;
}) {
	const url = new URL(ctx.request.url);
	const latencyMs = ctx._requestStart ? Date.now() - ctx._requestStart : 0;
	const statusNum = ctx.set?.status;
	recordApiRequest({
		method: ctx.request.method,
		path: url.pathname,
		status: typeof statusNum === "number" ? statusNum : undefined,
		latencyMs,
		userId: ctx.userId,
		studentId: ctx.studentId,
	});
	log.info(`API ${ctx.request.method} ${url.pathname}`, {
		status: statusNum,
		latencyMs,
		userId: ctx.userId,
		studentId: ctx.studentId,
	});
}

export function logApiError(ctx: {
	request: Request;
	error?: Error | { message?: string };
	code?: string | number;
	_requestStart?: number;
}) {
	const url = new URL(ctx.request.url);
	const latencyMs = ctx._requestStart ? Date.now() - ctx._requestStart : 0;
	const errorMsg = ctx.error instanceof Error ? ctx.error.message : String(ctx.error);
	recordApiRequest({
		method: ctx.request.method,
		path: url.pathname,
		latencyMs,
		error: errorMsg,
	});
	log.error(`API ${ctx.request.method} ${url.pathname} - ${errorMsg}`, {
		latencyMs,
		code: ctx.code,
	});
}
