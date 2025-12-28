import { NextRequest, NextResponse } from "next/server"
import { getSession } from "./session"

export async function getAuthSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  let sessionToken: string | null = null

  if (authHeader) {
    sessionToken = authHeader.replace("Bearer ", "")
  } else {
    sessionToken = request.cookies.get("auth_token")?.value || null
  }

  if (!sessionToken) {
    return null
  }

  try {
    const session = await getSession(sessionToken)
    return session
  } catch {
    return null
  }
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    "/welcome",
    "/auth/login",
    "/auth/register",
    "/api/auth",
    "/onboarding",
  ]

  return publicRoutes.some((route) => pathname.startsWith(route))
}

