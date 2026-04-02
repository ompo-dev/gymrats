import type { NextRequest } from "@/runtime/next-server";

type HeaderSource = Pick<NextRequest, "headers"> | Headers;

function toHeaders(input: HeaderSource): Headers {
  return input instanceof Headers ? input : input.headers;
}

export function getRequestIp(input: HeaderSource): string {
  const headers = toHeaders(input);

  for (const headerName of [
    "x-forwarded-for",
    "cf-connecting-ip",
    "x-real-ip",
    "x-client-ip",
  ]) {
    const value = headers.get(headerName);
    if (!value) {
      continue;
    }

    const candidate =
      headerName === "x-forwarded-for"
        ? value.split(",")[0]?.trim()
        : value.trim();

    if (candidate) {
      return candidate;
    }
  }

  return "127.0.0.1";
}

export function getRequestUserAgent(input: HeaderSource): string {
  return toHeaders(input).get("user-agent")?.trim() || "unknown";
}
