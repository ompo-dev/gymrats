import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await request.json()

    if (!userId || !userType) {
      return NextResponse.json(
        { error: "userId e userType são obrigatórios" },
        { status: 400 }
      )
    }

    // Atualizar role do usuário
    const role = userType === "student" ? "STUDENT" : "GYM"

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
    })

    // Criar Student ou Gym se necessário
    if (userType === "student") {
      const existingStudent = await db.student.findUnique({
        where: { userId },
      })

      if (!existingStudent) {
        await db.student.create({
          data: { userId },
        })
      }
    } else if (userType === "gym") {
      const existingGym = await db.gym.findUnique({
        where: { userId },
      })

      if (!existingGym) {
        await db.gym.create({
          data: {
            userId,
            name: updatedUser.name,
            address: "",
            phone: "",
            email: updatedUser.email,
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

