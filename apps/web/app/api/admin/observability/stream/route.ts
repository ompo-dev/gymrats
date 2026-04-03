import { buildForwardHeaders, buildServerApiUrl } from "@/lib/api/server";

export async function GET() {
  const response = await fetch(buildServerApiUrl("/api/admin/observability/stream"), {
    method: "GET",
    headers: await buildForwardHeaders(),
    cache: "no-store",
  });

  const headers = new Headers();
  headers.set(
    "Content-Type",
    response.headers.get("content-type") ?? "text/event-stream; charset=utf-8",
  );
  headers.set(
    "Cache-Control",
    response.headers.get("cache-control") ?? "no-cache, no-transform",
  );
  headers.set(
    "Connection",
    response.headers.get("connection") ?? "keep-alive",
  );
  headers.set("X-Accel-Buffering", "no");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
