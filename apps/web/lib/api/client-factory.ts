import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { refreshAuthToken } from "@/lib/auth/token-client";
import { resolveApiBaseUrl } from "./resolve-api-base-url";

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

let axiosInstance: AxiosInstance | null = null;

export { resolveApiBaseUrl };

export function getAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    axiosInstance = createAxiosClient();
  }

  return axiosInstance;
}

function createAxiosClient(): AxiosInstance {
  const client = axios.create({
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use(
    async (config) => {
      const baseUrl = resolveApiBaseUrl();
      if (baseUrl) {
        config.baseURL = baseUrl;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url;

      if (status === 401 && typeof window !== "undefined") {
        if (url?.includes("/api/auth/session")) {
          return Promise.reject(error);
        }

        const originalConfig = error?.config as
          | (AxiosRequestConfig & { _authRetried?: boolean })
          | undefined;

        if (originalConfig && !originalConfig._authRetried) {
          originalConfig._authRetried = true;
          const sessionRestored = await refreshAuthToken();

          if (sessionRestored) {
            return client.request(originalConfig);
          }
        }

        return Promise.reject(error);
      }

      if (status === 500 && typeof url === "string") {
        if (SILENT_500_ROUTES.some((route) => url.includes(route))) {
          error._isHandled = true;
          error._isSilent = true;
        }
      }

      if (status === 404 && typeof url === "string") {
        if (SILENT_404_ROUTES.some((route) => url.includes(route))) {
          error._isHandled = true;
          error._isSilent = true;
        }
      }

      if (status === 429 && typeof window !== "undefined") {
        toast.error("Muitas requisicoes. Aguarde um momento.", {
          id: "rate-limit-toast",
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

export function createApiClient(_options?: { offline?: boolean }): ApiClient {
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
