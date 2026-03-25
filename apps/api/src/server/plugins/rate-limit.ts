import { rateLimit } from "elysia-rate-limit";

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const rateLimitWindowMs = parsePositiveInt(
  process.env.API_RATE_LIMIT_WINDOW_MS,
  60_000,
);
const rateLimitMax = parsePositiveInt(process.env.API_RATE_LIMIT_MAX, 300);

// Rate limit global por IP.
// Continua in-memory, mas agora com configuração explícita e comentário coerente.
export const rateLimitPlugin = rateLimit({
  duration: rateLimitWindowMs,
  max: rateLimitMax,
  generator: (req: Request) => {
    for (const headerName of [
      "x-forwarded-for",
      "cf-connecting-ip",
      "x-real-ip",
      "x-client-ip",
    ]) {
      const headerValue = req.headers.get(headerName);
      if (!headerValue) {
        continue;
      }

      const candidate =
        headerName === "x-forwarded-for"
          ? headerValue.split(",")[0]?.trim()
          : headerValue.trim();

      if (candidate) {
        return candidate;
      }
    }

    return "127.0.0.1";
  },
  skip: (req: Request) => {
    if (req.method === "OPTIONS") {
      return true;
    }

    const pathname = new URL(req.url).pathname;
    return pathname === "/health" || pathname === "/healthz";
  },
  errorResponse: new Response("Too Many Requests", {
    status: 429,
    headers: { "Content-Type": "text/plain" },
  }),
});
