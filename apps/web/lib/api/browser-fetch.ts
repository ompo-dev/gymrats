"use client";

import { refreshAuthToken } from "@/lib/auth/token-client";
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
  const requestUrl = buildApiUrl(path);
  const isSessionRequest = requestUrl.includes("/api/auth/session");

  let response = await fetch(requestUrl, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: new Headers(init.headers),
  });

  if (response.status === 401 && !isSessionRequest) {
    const sessionRestored = await refreshAuthToken();

    if (sessionRestored) {
      response = await fetch(requestUrl, {
        cache: "no-store",
        credentials: "include",
        ...init,
        headers: new Headers(init.headers),
      });
    }
  }

  return response;
}

export function getBrowserApiUrl(path: string): string {
  return buildApiUrl(path);
}
