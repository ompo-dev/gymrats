import { headers } from "next/headers";
import { resolveApiBaseUrl } from "./client-factory";

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

function buildUrl(path: string): string {
  const baseUrl = resolveApiBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function buildForwardHeaders(
  initHeaders?: HeadersInit,
): Promise<Headers> {
  const incomingHeaders = await headers();
  const outgoingHeaders = new Headers(initHeaders);

  const cookie = incomingHeaders.get("cookie");
  if (cookie && !outgoingHeaders.has("cookie")) {
    outgoingHeaders.set("cookie", cookie);
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

async function parseJsonResponse(response: Response): Promise<unknown> {
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
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    cache: "no-store",
    headers: await buildForwardHeaders(init.headers),
  });

  const payload = await parseJsonResponse(response);

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
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
