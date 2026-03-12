import { rateLimit } from "elysia-rate-limit";

// Rate Limit global de 100 requisições por minuto por IP
// Baseado na arquitetura Elysia In-Memory conforme aprovação do usuário
export const rateLimitPlugin = rateLimit({
  duration: 60000, // 60 segundos
  max: 300, // limite de chamadas por duration
  generator: (req: Request) => {
    // Tenta pegar o IP real caso esteja atrás de proxy/Vercel
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
      return realIp;
    }
    // Fallback caso não venha IP no header (loopback)
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
