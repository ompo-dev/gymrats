"use client";

import {
  ensureAuthToken,
  getAuthToken,
  refreshAuthToken,
} from "@/lib/auth/token-client";
import { resolveApiBaseUrl } from "./client-factory";

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = resolveApiBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export async function browserApiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const requestUrl = buildApiUrl(path);
  const isSessionRequest = requestUrl.includes("/api/auth/session");
  const token =
    getAuthToken() || (isSessionRequest ? null : await ensureAuthToken());

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(requestUrl, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers,
  });

  if (response.status === 401 && !isSessionRequest) {
    const refreshedToken = await refreshAuthToken();

    if (refreshedToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

      response = await fetch(requestUrl, {
        cache: "no-store",
        credentials: "include",
        ...init,
        headers: retryHeaders,
      });
    }
  }

  return response;
}

export function getBrowserApiUrl(path: string): string {
  return buildApiUrl(path);
}
