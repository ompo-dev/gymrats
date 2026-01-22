import { createServer } from "http";
import { parse } from "url";
import { apiApp } from "./app";

const nodeEnv = process.env.NODE_ENV || "development";
const dev = nodeEnv !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT || 3000);

if (dev) {
  process.env.NEXT_DISABLE_TURBOPACK ||= "1";
  process.env.TURBOPACK ||= "0";
  process.env.NEXT_TURBOPACK ||= "0";
  process.env.NEXT_WEBPACK ||= "1";
}

const next = (await import("next")).default;
const nextApp = next({ dev, hostname, port });
const handleNext = nextApp.getRequestHandler();

async function nodeToRequest(req: import("http").IncomingMessage) {
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) || "http";
  const host =
    (req.headers["x-forwarded-host"] as string | undefined) ||
    req.headers.host ||
    "localhost";
  const url = new URL(req.url || "/", `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else if (value) {
      headers.set(key, value);
    }
  }

  const method = req.method || "GET";
  if (method === "GET" || method === "HEAD") {
    return new Request(url, { method, headers });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  return new Request(url, { method, headers, body });
}

function applyResponseHeaders(
  res: import("http").ServerResponse,
  response: Response
) {
  const headers: Record<string, string | string[]> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const getSetCookie = (response.headers as any).getSetCookie;
  if (typeof getSetCookie === "function") {
    const cookies = getSetCookie.call(response.headers);
    if (Array.isArray(cookies) && cookies.length > 0) {
      headers["set-cookie"] = cookies;
    }
  }

  res.writeHead(response.status, headers);
}

async function handleApiRequest(
  req: import("http").IncomingMessage,
  res: import("http").ServerResponse
) {
  const request = await nodeToRequest(req);
  const response = await apiApp.handle(request);

  applyResponseHeaders(res, response);
  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}

nextApp.prepare().then(() => {
  const server = createServer(async (req, res) => {
    if (!req.url) {
      return handleNext(req, res);
    }

    const { pathname } = parse(req.url, true);
    if (pathname && pathname.startsWith("/api")) {
      await handleApiRequest(req, res);
      return;
    }

    await handleNext(req, res);
  });

  server.listen(port, hostname, () => {
    console.log(
      `🚀 Next + Elysia on Bun: http://${hostname}:${port} (${dev ? "dev" : "prod"})`
    );
  });
});
