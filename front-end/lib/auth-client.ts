import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  fetch: (input, init) =>
    fetch(input, { ...init, credentials: "include" }),
})

export const { signIn, signUp, signOut, useSession } = authClient

