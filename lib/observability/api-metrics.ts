/**
 * Métricas de API (latência, status).
 * Usado por createSafeHandler e handlers para registrar requisições.
 */

import { log } from "./logger";

export type ApiMetricContext = {
	method: string;
	path: string;
	status?: number;
	latencyMs: number;
	userId?: string;
	studentId?: string;
	gymId?: string;
	error?: string;
};

export function recordApiRequest(ctx: ApiMetricContext) {
	const { method, path, status, latencyMs, error } = ctx;
	const message = error
		? `API ${method} ${path} ${status ?? "-"} ${latencyMs}ms - ${error}`
		: `API ${method} ${path} ${status ?? "-"} ${latencyMs}ms`;

	if (error) {
		log.error(message, ctx);
	} else {
		log.info(message, ctx);
	}
}
