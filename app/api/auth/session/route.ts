import { NextRequest, NextResponse } from "next/server"
import { getSessionTokenFromRequest } from "@/lib/utils/session"
import { getSession } from "@/lib/utils/session"
import { getCookie } from "@/lib/utils/cookies"

export async function GET(request: NextRequest) {
  try {
    let sessionToken = getSessionTokenFromRequest(request)
    
    if (!sessionToken) {
      sessionToken = await getCookie("auth_token")
    }

    if (!sessionToken) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const session = await getSession(sessionToken)

    if (!session) {
      return NextResponse.json({ error: "Sessão inválida ou expirada" }, { status: 401 })
    }

    // ADMIN tem acesso completo: tem tanto student quanto gym
    const isAdmin = session.user.role === "ADMIN"
    const hasGym = isAdmin || (session.user.gyms && session.user.gyms.length > 0)
    const hasStudent = isAdmin || !!session.user.student

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role, // Fonte da verdade: STUDENT, GYM ou ADMIN
        hasGym,
        hasStudent,
      },
      session: {
        id: session.id,
        token: session.sessionToken,
      },
    })
  } catch (error: any) {
    console.error("Erro ao buscar sessão:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar sessão" },
      { status: 500 }
    )
  }
}

