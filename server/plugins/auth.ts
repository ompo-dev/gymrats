import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { auth } from "@/lib/auth-config";

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
	.use(
		cors({
			origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.mount(auth.handler);
