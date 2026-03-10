/**
 * API Client offline (legado).
 *
 * Mantido apenas para compatibilidade de importações.
 * Toda escrita agora vai direto para a API — sem fila offline.
 */

import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type { JsonValue } from "@/lib/types/api-error";
import { createApiClient } from "./client-factory";

const apiClientOfflineInstance = createApiClient();

/**
 * Wrapper para compatibilidade com chamadas que usam config único (AxiosRequestConfig).
 */
export async function apiClientOffline<T = JsonValue>(
  config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> {
  const { url, method = "GET", data, headers } = config;
  if (!url) throw new Error("URL é obrigatória");

  switch ((method as string).toUpperCase()) {
    case "GET":
      return apiClientOfflineInstance.get<T>(url, { ...config, headers });
    case "POST":
      return apiClientOfflineInstance.post<T>(url, data, {
        ...config,
        headers,
      });
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
