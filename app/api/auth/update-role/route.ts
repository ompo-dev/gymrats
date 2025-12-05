import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { userId, role, userType } = await request.json()

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: userId },
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
        role: role === "student" ? "STUDENT" : "GYM",
      },
    })

    // Criar Student ou Gym se necessário
    if (userType === "student" && !user.student) {
      // Verificar se já existe Student
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
    } else if (userType === "gym" && !user.gym) {
      // Verificar se já existe Gym
      const existingGym = await db.gym.findUnique({
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
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        userType,
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

