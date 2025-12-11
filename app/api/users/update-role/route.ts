import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { initializeStudentTrial, initializeGymTrial } from "@/lib/utils/auto-trial"

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

    // Criar Student ou Gym se necessário e inicializar trial
    if (userType === "student") {
      const existingStudent = await db.student.findUnique({
        where: { userId },
      })

      let student
      if (!existingStudent) {
        student = await db.student.create({
          data: { userId },
        })
      } else {
        student = existingStudent
      }

      // Inicializar trial automaticamente para o aluno
      if (student) {
        await initializeStudentTrial(student.id)
      }
    } else if (userType === "gym") {
      const existingGym = await db.gym.findUnique({
        where: { userId },
      })

      let gym
      if (!existingGym) {
        gym = await db.gym.create({
          data: {
            userId,
            name: updatedUser.name,
            address: "",
            phone: "",
            email: updatedUser.email,
          },
        })
      } else {
        gym = existingGym
      }

      // Inicializar trial automaticamente para a academia
      if (gym) {
        await initializeGymTrial(gym.id)
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

