/**
 * Factory unificada para API Client.
 *
 * createApiClient({ offline?: boolean }) retorna cliente configurado.
 * - offline: false (padrão) → axios com interceptors (token, 401, rotas silenciosas)
 * - offline: true → syncManager (fila IndexedDB quando offline)
 */

import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";
import { clearAuthToken, getAuthToken } from "@/lib/auth/token-client";
import { syncManager } from "@/lib/offline/sync-manager";

const API_BASE_URL =
	typeof window !== "undefined"
		? ""
		: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const SILENT_500_ROUTES = [
	"/api/students/",
	"/api/workouts/",
	"/api/nutrition/",
	"/api/subscriptions/",
	"/api/memberships",
	"/api/payments",
	"/api/payment-methods",
	"/api/gyms/",
];

const SILENT_404_ROUTES = [
	"/api/students/",
	"/api/workouts/",
	"/api/nutrition/",
];

let _axiosInstance: AxiosInstance | null = null;

/** Retorna instância axios compartilhada (com interceptors). Usado pelo mutator Orval. */
export function getAxiosInstance(): AxiosInstance {
	if (!_axiosInstance) _axiosInstance = createAxiosClient();
	return _axiosInstance;
}

function createAxiosClient(): AxiosInstance {
	const finalBaseURL =
		typeof window !== "undefined" ? "" : API_BASE_URL || "http://localhost:3000";

	const client = axios.create({
		baseURL: finalBaseURL,
		headers: { "Content-Type": "application/json" },
	});

	client.interceptors.request.use(
		(config) => {
			if (typeof window !== "undefined") {
				if (
					config.baseURL &&
					(config.baseURL.startsWith("http://") ||
						config.baseURL.startsWith("https://")) &&
					!config.baseURL.includes(":3000")
				) {
					config.baseURL = "";
				} else if (!config.baseURL) {
					config.baseURL = "";
				}
				if (config.url?.startsWith("http://localhost:3000")) {
					config.url = config.url.replace("http://localhost:3000", "");
				}
			}
			const token = getAuthToken();
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		},
		(err) => Promise.reject(err),
	);

	client.interceptors.response.use(
		(res) => res,
		(error) => {
			const status = error?.response?.status;
			const url = error?.config?.url;

			if (status === 401 && typeof window !== "undefined") {
				clearAuthToken();
				window.location.href = "/welcome";
			}

			if (status === 500 && url && typeof url === "string") {
				if (SILENT_500_ROUTES.some((r) => url.includes(r))) {
					error._isHandled = true;
					error._isSilent = true;
				}
			}

			if (status === 404 && url && typeof url === "string") {
				if (SILENT_404_ROUTES.some((r) => url.includes(r))) {
					error._isHandled = true;
					error._isSilent = true;
				}
			}

			return Promise.reject(error);
		},
	);

	return client;
}

async function requestViaSyncManager<T>(
	config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
	const { url, method = "GET", data, headers } = config;
	if (!url) throw new Error("URL é obrigatória");

	const token = getAuthToken();
	const requestHeaders: Record<string, string> = {
		...(headers as Record<string, string>),
	};
	if (token) requestHeaders.Authorization = `Bearer ${token}`;

	const result = await syncManager({
		url,
		method: (method?.toUpperCase() || "GET") as
			| "GET"
			| "POST"
			| "PUT"
			| "PATCH"
			| "DELETE",
		body: data,
		headers: requestHeaders,
	});

	if (!result.success) {
		throw result.error || new Error("Erro ao executar requisição");
	}

	if (result.queued) {
		return {
			data: { queued: true, queueId: result.queueId } as T,
			status: 202,
			statusText: "Accepted",
			headers: {},
			config: config as Record<string, string | number | boolean | object | null>,
		} as AxiosResponse<T>;
	}

	return {
		data: result.data as T,
		status: 200,
		statusText: "OK",
		headers: {},
		config: config as Record<string, string | number | boolean | object | null>,
	} as AxiosResponse<T>;
}

export type ApiClient = {
	get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
	post<T>(
		url: string,
		data?: Record<string, string | number | boolean | object | null>,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>>;
	put<T>(
		url: string,
		data?: Record<string, string | number | boolean | object | null>,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>>;
	patch<T>(
		url: string,
		data?: Record<string, string | number | boolean | object | null>,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>>;
	delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
};

export function createApiClient(options?: { offline?: boolean }): ApiClient {
	const useOffline = options?.offline ?? false;

	if (useOffline) {
		return {
			get: (url, config) =>
				requestViaSyncManager({ ...config, url, method: "GET" }),
			post: (url, data, config) =>
				requestViaSyncManager({ ...config, url, method: "POST", data }),
			put: (url, data, config) =>
				requestViaSyncManager({ ...config, url, method: "PUT", data }),
			patch: (url, data, config) =>
				requestViaSyncManager({ ...config, url, method: "PATCH", data }),
			delete: (url, config) =>
				requestViaSyncManager({ ...config, url, method: "DELETE" }),
		};
	}

	const client = createAxiosClient();
	return {
		async get<T>(url: string, config?: AxiosRequestConfig) {
			return client.get<T>(url, config);
		},
		async post<T>(
			url: string,
			data?: Record<string, string | number | boolean | object | null>,
			config?: AxiosRequestConfig,
		) {
			return client.post<T>(url, data, {
				timeout: 30000,
				...config,
			});
		},
		async put<T>(url: string, data?: Record<string, string | number | boolean | object | null>, config?: AxiosRequestConfig) {
			return client.put<T>(url, data, config);
		},
		async patch<T>(
			url: string,
			data?: Record<string, string | number | boolean | object | null>,
			config?: AxiosRequestConfig,
		) {
			return client.patch<T>(url, data, config);
		},
		async delete<T>(url: string, config?: AxiosRequestConfig) {
			return client.delete<T>(url, config);
		},
	};
}
