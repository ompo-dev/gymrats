import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsPlugin = new Elysia({ name: "cors" }).use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: true,
  }),
);
