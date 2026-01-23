import axios, { type AxiosRequestConfig } from "axios";
import { cookies } from "next/headers";

const DEFAULT_API_URL = "http://localhost:3001";

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    DEFAULT_API_URL
  );
}

async function buildCookieHeader() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  if (!allCookies.length) {
    return "";
  }

  return allCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function backendRequest<T>(config: AxiosRequestConfig) {
  const cookieHeader = await buildCookieHeader();
  const headers = {
    ...(config.headers || {}),
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
  };

  const response = await axios.request<T>({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
    ...config,
    headers,
  });

  return response.data;
}

export async function backendGet<T>(url: string, config?: AxiosRequestConfig) {
  return backendRequest<T>({ ...config, method: "GET", url });
}

export async function backendPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) {
  return backendRequest<T>({ ...config, method: "POST", url, data });
}

export async function backendPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) {
  return backendRequest<T>({ ...config, method: "PUT", url, data });
}

export async function backendPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) {
  return backendRequest<T>({ ...config, method: "PATCH", url, data });
}
