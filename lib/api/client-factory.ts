/**
 * Factory unificada para API Client.
 *
 * createApiClient() retorna um cliente HTTP baseado em axios,
 * com interceptors de autenticação e tratamento de erros padronizado.
 * Não há mais modo offline: toda escrita é feita diretamente contra a API.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { clearAuthToken, getAuthToken } from "@/lib/auth/token-client";

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
    typeof window !== "undefined"
      ? ""
      : API_BASE_URL || "http://localhost:3000";

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
        // Prevent automatic redirect for session validation
        if (url?.includes("/api/auth/session")) {
          return Promise.reject(error);
        }
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

      if (status === 429 && typeof window !== "undefined") {
        toast.error("Muitas requisições. Por favor, aguarde um momento.", {
          id: "rate-limit-toast", // Evita toasts duplicados rapidamente
        });
        error._isHandled = true;
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export type ApiClient = {
  get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<import("axios").AxiosResponse<T>>;
  post<T>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig,
  ): Promise<import("axios").AxiosResponse<T>>;
  put<T>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig,
  ): Promise<import("axios").AxiosResponse<T>>;
  patch<T>(
    url: string,
    data?: object,
    config?: AxiosRequestConfig,
  ): Promise<import("axios").AxiosResponse<T>>;
  delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<import("axios").AxiosResponse<T>>;
};

export function createApiClient(): ApiClient {
  const client = createAxiosClient();
  return {
    get<T>(url: string, config?: AxiosRequestConfig) {
      return client.get<T>(url, config);
    },
    post<T>(url: string, data?: object, config?: AxiosRequestConfig) {
      return client.post<T>(url, data, {
        timeout: 30000,
        ...config,
      });
    },
    put<T>(url: string, data?: object, config?: AxiosRequestConfig) {
      return client.put<T>(url, data, config);
    },
    patch<T>(url: string, data?: object, config?: AxiosRequestConfig) {
      return client.patch<T>(url, data, config);
    },
    delete<T>(url: string, config?: AxiosRequestConfig) {
      return client.delete<T>(url, config);
    },
  };
}
