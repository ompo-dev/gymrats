import { NextRequest, NextResponse } from "next/server"
import { getSessionTokenFromRequest, deleteSession } from "@/lib/utils/session"
import { getCookie, deleteCookie } from "@/lib/utils/cookies"

export async function POST(request: NextRequest) {
  try {
    let sessionToken = getSessionTokenFromRequest(request)
    
    if (!sessionToken) {
      sessionToken = await getCookie("auth_token")
    }

    if (!sessionToken) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    if (sessionToken) {
      await deleteSession(sessionToken)
    }

    await deleteCookie("auth_token")

    const response = NextResponse.json({ success: true })
    response.cookies.delete("auth_token")

    return response
  } catch (error: any) {
    console.error("Erro ao fazer logout:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao fazer logout" },
      { status: 500 }
    )
  }
}

