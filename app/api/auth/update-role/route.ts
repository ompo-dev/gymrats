import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId e role são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o role é válido
    if (!["STUDENT", "GYM", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido. Deve ser STUDENT, GYM ou ADMIN" },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        gyms: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: role as "STUDENT" | "GYM" | "ADMIN",
      },
    })

    // Criar Student ou Gym se necessário baseado no role
    if (role === "STUDENT" && !user.student) {
      const existingStudent = await db.student.findUnique({
        where: { userId },
      })

      if (!existingStudent) {
        await db.student.create({
          data: {
            userId,
          },
        })
      }
    } else if (role === "GYM" && (!user.gyms || user.gyms.length === 0)) {
      const existingGym = await db.gym.findFirst({
        where: { userId },
      })

      if (!existingGym) {
        await db.gym.create({
          data: {
            userId,
            name: user.name,
            address: "",
            phone: "",
            email: user.email,
            plan: "basic",
            isActive: true,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
    })
  } catch (error: any) {
    console.error("Erro ao atualizar role:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar tipo de usuário" },
      { status: 500 }
    )
  }
}

