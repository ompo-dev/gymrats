/**
 * API Client com suporte offline (syncManager).
 * Usa createApiClient da factory. Para uso em ações que devem enfileirar quando offline.
 */

import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { createApiClient } from "./client-factory";

const apiClientOfflineInstance = createApiClient({ offline: true });

/**
 * Wrapper para compatibilidade com chamadas que usam config único (AxiosRequestConfig).
 */
export async function apiClientOffline<T = unknown>(
	config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
	const { url, method = "GET", data, headers } = config;
	if (!url) throw new Error("URL é obrigatória");

	switch ((method as string).toUpperCase()) {
		case "GET":
			return apiClientOfflineInstance.get<T>(url, { ...config, headers });
		case "POST":
			return apiClientOfflineInstance.post<T>(url, data, { ...config, headers });
		case "PUT":
			return apiClientOfflineInstance.put<T>(url, data, { ...config, headers });
		case "PATCH":
			return apiClientOfflineInstance.patch<T>(url, data, {
				...config,
				headers,
			});
		case "DELETE":
			return apiClientOfflineInstance.delete<T>(url, { ...config, headers });
		default:
			return apiClientOfflineInstance.get<T>(url, { ...config, headers });
	}
}
