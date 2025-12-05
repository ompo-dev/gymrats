import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/utils/session"

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("auth_token")?.value || 
                        request.headers.get("authorization")?.replace("Bearer ", "")

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const session = await getSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      )
    }

    const userId = session.userId
    const data = await request.json()

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { student: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Usuário não é um aluno" },
        { status: 403 }
      )
    }

    let student = user.student
    if (!student) {
      student = await db.student.create({
        data: {
          userId,
          age: data.age,
          gender: data.gender,
        },
      })
    } else {
      student = await db.student.update({
        where: { id: student.id },
        data: {
          age: data.age,
          gender: data.gender,
        },
      })
    }

    const profileData = {
      studentId: student.id,
      height: data.height ? (typeof data.height === "number" ? data.height : parseFloat(String(data.height))) : null,
      weight: data.weight ? (typeof data.weight === "number" ? data.weight : parseFloat(String(data.weight))) : null,
      fitnessLevel: data.fitnessLevel || null,
      weeklyWorkoutFrequency: data.weeklyWorkoutFrequency ? parseInt(String(data.weeklyWorkoutFrequency)) : null,
      workoutDuration: data.workoutDuration ? parseInt(String(data.workoutDuration)) : null,
      goals: data.goals && Array.isArray(data.goals) ? JSON.stringify(data.goals) : null,
      injuries: data.injuries && Array.isArray(data.injuries) ? JSON.stringify(data.injuries) : null,
      availableEquipment: data.availableEquipment && Array.isArray(data.availableEquipment) ? JSON.stringify(data.availableEquipment) : null,
      gymType: data.gymType || null,
      preferredWorkoutTime: data.preferredWorkoutTime || null,
      preferredSets: data.preferredSets ? parseInt(String(data.preferredSets)) : null,
      preferredRepRange: data.preferredRepRange || null,
      restTime: data.restTime || null,
      dietType: data.dietType || null,
      allergies: data.allergies && Array.isArray(data.allergies) ? JSON.stringify(data.allergies) : null,
      targetCalories: data.targetCalories ? parseInt(String(data.targetCalories)) : null,
      targetProtein: data.targetProtein ? (typeof data.targetProtein === "number" ? data.targetProtein : parseFloat(String(data.targetProtein))) : null,
      targetCarbs: data.targetCarbs ? (typeof data.targetCarbs === "number" ? data.targetCarbs : parseFloat(String(data.targetCarbs))) : null,
      targetFats: data.targetFats ? (typeof data.targetFats === "number" ? data.targetFats : parseFloat(String(data.targetFats))) : null,
      mealsPerDay: data.mealsPerDay ? parseInt(String(data.mealsPerDay)) : null,
    }

    await db.studentProfile.upsert({
      where: { studentId: student.id },
      create: profileData,
      update: profileData,
    })

    if (!student.progress) {
      await db.studentProgress.create({
        data: {
          studentId: student.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Perfil salvo com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao salvar perfil:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao salvar perfil" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("auth_token")?.value || 
                        request.headers.get("authorization")?.replace("Bearer ", "")

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      )
    }

    const session = await getSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      )
    }

    const userId = session.userId

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    })

    if (!user || !user.student) {
      return NextResponse.json({
        hasProfile: false,
      })
    }

    const hasProfile = !!user.student.profile && 
                      user.student.profile.height !== null &&
                      user.student.profile.weight !== null &&
                      user.student.profile.fitnessLevel !== null

    return NextResponse.json({
      hasProfile,
      profile: user.student.profile ? {
        height: user.student.profile.height,
        weight: user.student.profile.weight,
        fitnessLevel: user.student.profile.fitnessLevel,
        weeklyWorkoutFrequency: user.student.profile.weeklyWorkoutFrequency,
        workoutDuration: user.student.profile.workoutDuration,
        goals: user.student.profile.goals ? JSON.parse(user.student.profile.goals) : [],
        availableEquipment: user.student.profile.availableEquipment ? JSON.parse(user.student.profile.availableEquipment) : [],
        gymType: user.student.profile.gymType,
        preferredWorkoutTime: user.student.profile.preferredWorkoutTime,
        preferredSets: user.student.profile.preferredSets,
        preferredRepRange: user.student.profile.preferredRepRange,
        restTime: user.student.profile.restTime,
      } : null,
    })
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar perfil" },
      { status: 500 }
    )
  }
}

