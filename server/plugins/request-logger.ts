import { Elysia } from "elysia";
import { logApiError, logApiRequest } from "../utils/logger";

/**
 * Plugin de logging para todas as rotas da API.
 * Registra: path, method, status, latência, userId, studentId, ip, userAgent.
 * Logs em JSON para monitoramento e agregadores.
 */
export const requestLoggerPlugin = new Elysia({ name: "request-logger" })
	.derive(() => ({
		_requestStart: Date.now(),
	}))
	.onAfterResponse((ctx) => {
		const url = ctx.request.url;
		if (url.includes("/api") || url.includes("/health")) {
			const c = ctx as {
				_requestStart?: number;
				userId?: string;
				studentId?: string;
				body?: unknown;
				response?: unknown;
			};
			logApiRequest({
				request: ctx.request,
				set: {
					status:
						typeof ctx.set?.status === "number" ? ctx.set.status : undefined,
				},
				body: c.body,
				response:
					c.response ??
					(ctx as { responseValue?: unknown }).responseValue ??
					undefined,
				_requestStart: c._requestStart,
				userId: c.userId,
				studentId: c.studentId,
			});
		}
	})
	.onError((ctx) => {
		if (ctx.request.url.includes("/api")) {
			logApiError({
				request: ctx.request,
				error: ctx.error,
				code: ctx.code,
				_requestStart: (ctx as { _requestStart?: number })._requestStart,
			});
		}
	});
