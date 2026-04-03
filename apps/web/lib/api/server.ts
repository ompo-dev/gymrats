import { headers } from "next/headers";
import { extractSessionTokenFromHeaders } from "@gymrats/domain/auth-tokens";
import { resolveApiBaseUrl } from "./resolve-api-base-url";

type JsonObject = Record<string, unknown>;

export class ServerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

export function buildServerApiUrl(path: string): string {
  const baseUrl = resolveApiBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function buildForwardHeaders(
  initHeaders?: HeadersInit,
): Promise<Headers> {
  const incomingHeaders = await headers();
  const outgoingHeaders = new Headers(initHeaders);

  const cookie = incomingHeaders.get("cookie");
  if (cookie && !outgoingHeaders.has("cookie")) {
    outgoingHeaders.set("cookie", cookie);
  }

  const sessionToken = extractSessionTokenFromHeaders(
    new Headers(cookie ? { cookie } : undefined),
  );
  if (sessionToken && !outgoingHeaders.has("authorization")) {
    outgoingHeaders.set("authorization", `Bearer ${sessionToken}`);
  }

  const authorization = incomingHeaders.get("authorization");
  if (authorization && !outgoingHeaders.has("authorization")) {
    outgoingHeaders.set("authorization", authorization);
  }

  const userAgent = incomingHeaders.get("user-agent");
  if (userAgent && !outgoingHeaders.has("user-agent")) {
    outgoingHeaders.set("user-agent", userAgent);
  }

  return outgoingHeaders;
}

export async function buildForwardHeadersSnapshot(
  initHeaders?: HeadersInit,
): Promise<Record<string, string>> {
  const outgoingHeaders = await buildForwardHeaders(initHeaders);
  return Object.fromEntries(outgoingHeaders.entries());
}

export async function parseServerApiJsonResponse(
  response: Response,
): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function serverApiRequest<T>(
  path: string,
  init: RequestInit = {},
  options?: {
    skipForwardHeaders?: boolean;
  },
): Promise<T> {
  const response = await fetch(buildServerApiUrl(path), {
    ...init,
    cache: init.cache,
    headers: options?.skipForwardHeaders
      ? init.headers
      : await buildForwardHeaders(init.headers),
  });

  const payload = await parseServerApiJsonResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as JsonObject).error === "string"
        ? ((payload as JsonObject).error as string)
        : `API request failed for ${path}`;

    throw new ServerApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function serverApiGet<T>(path: string): Promise<T> {
  return serverApiRequest<T>(path, { method: "GET" });
}

export async function serverApiPost<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return serverApiRequest<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function serverApiPatch<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return serverApiRequest<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function serverApiDelete<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  return serverApiRequest<T>(path, {
    method: "DELETE",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
