import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/utils/session"
import { signUpSchema } from "@/lib/api/schemas"
import { validateBody } from "@/lib/api/middleware/validation.middleware"

export async function POST(request: NextRequest) {
  try {
    // Validar body com Zod
    const validation = await validateBody(request, signUpSchema)
    if (!validation.success) {
      return validation.response
    }

    const { name, email, password } = validation.data

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "STUDENT",
      },
    })

    await db.student.create({
      data: {
        userId: newUser.id,
      },
    })

    const sessionToken = await createSession(newUser.id)

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
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
    console.error("Erro ao criar conta:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao criar conta" },
      { status: 500 }
    )
  }
}
