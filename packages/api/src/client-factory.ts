import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { clearAuthToken, getAuthToken } from "./token-client";

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

function normalizeBaseUrl(url: string | undefined): string {
  if (!url) return "";
  return url.replace(/\/$/, "");
}

export function resolveApiBaseUrl(): string {
  const publicUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  const internalUrl = normalizeBaseUrl(process.env.API_INTERNAL_URL);

  if (typeof window !== "undefined") {
    return publicUrl || "";
  }

  return internalUrl || publicUrl || "http://localhost:4000";
}

export function getAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    axiosInstance = createAxiosClient();
  }

  return axiosInstance;
}

function createAxiosClient(): AxiosInstance {
  const client = axios.create({
    baseURL: resolveApiBaseUrl(),
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url;

      if (status === 401 && typeof window !== "undefined") {
        if (url?.includes("/api/auth/session")) {
          return Promise.reject(error);
        }

        clearAuthToken();
        window.location.href = "/welcome";
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
