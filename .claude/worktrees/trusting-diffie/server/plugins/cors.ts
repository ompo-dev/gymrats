import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

export const corsPlugin = new Elysia({ name: "cors" }).use(
	cors({
		origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);
