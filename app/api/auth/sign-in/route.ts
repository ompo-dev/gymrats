import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/utils/session"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        student: {
          select: {
            id: true,
          },
        },
        gym: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    let userType: "student" | "gym" | null = null
    if (user.role === "STUDENT" || user.student) {
      userType = "student"
    } else if (user.role === "GYM" || user.gym) {
      userType = "gym"
    }

    const sessionToken = await createSession(user.id)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType,
        role: user.role,
      },
      session: {
        token: sessionToken,
      },
    })

    response.cookies.set("auth_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("Erro ao fazer login:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao fazer login"
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === "development" ? error.stack : undefined },
      { status: 500 }
    )
  }
}
