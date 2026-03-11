import { AsyncLocalStorage } from "node:async_hooks";

type RequestRuntimeContext = {
  headers: Headers;
};

const requestContextStorage = new AsyncLocalStorage<RequestRuntimeContext>();

export function runWithRequestContext<T>(
  headers: Headers,
  callback: () => T,
): T {
  return requestContextStorage.run(
    {
      headers: new Headers(headers),
    },
    callback,
  );
}

export function getRequestContextHeaders(): Headers | null {
  return requestContextStorage.getStore()?.headers ?? null;
}

export function getRequestContextCookie(name: string): string | null {
  const headers = getRequestContextHeaders();
  const cookieHeader = headers?.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawKey, ...rest] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}
