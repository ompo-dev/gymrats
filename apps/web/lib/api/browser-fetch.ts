"use client";

import { getAuthToken } from "@/lib/auth/token-client";
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
  const token = getAuthToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(buildApiUrl(path), {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers,
  });
}

export function getBrowserApiUrl(path: string): string {
  return buildApiUrl(path);
}
