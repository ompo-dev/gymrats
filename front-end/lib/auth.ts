// Better Auth configuration
// This file will be used for Better Auth setup when we integrate it fully
// For now, we're using a hybrid approach with JSON Server + API routes

export const authConfig = {
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
}

