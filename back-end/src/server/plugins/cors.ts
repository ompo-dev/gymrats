import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || "";
const allowedOrigins = rawAllowedOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigin =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const corsPlugin = new Elysia({ name: "cors" }).use(
  cors({
    origin: (origin) => {
      if (!origin) return defaultOrigin;
      if (allowedOrigins.length === 0) {
        return origin === defaultOrigin;
      }
      return allowedOrigins.includes(origin);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
