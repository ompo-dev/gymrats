"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { db } from "@/lib/db";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import type { OnboardingData } from "./steps/types";

export async function submitOnboarding(formData: OnboardingData) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return { success: false, error: "Não autenticado" };
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return { success: false, error: "Sessão inválida" };
    }

    const userId = session.userId;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    if (user.role !== "STUDENT") {
      return { success: false, error: "Usuário não é um aluno" };
    }

    let student = user.student;
    if (!student) {
      student = await db.student.create({
        data: {
          userId,
          age: typeof formData.age === "number" ? formData.age : null,
          gender: formData.gender || null,
        },
      });
    } else {
      student = await db.student.update({
        where: { id: student.id },
        data: {
          age: typeof formData.age === "number" ? formData.age : null,
          gender: formData.gender || null,
        },
      });
    }

    const profileData = {
      studentId: student.id,
      height:
        formData.height && typeof formData.height === "number"
          ? formData.height
          : null,
      weight:
        formData.weight && typeof formData.weight === "number"
          ? formData.weight
          : null,
      fitnessLevel: formData.fitnessLevel || null,
      weeklyWorkoutFrequency: formData.weeklyWorkoutFrequency || null,
      workoutDuration: formData.workoutDuration || null,
      goals: formData.goals.length > 0 ? JSON.stringify(formData.goals) : null,
      gymType: formData.gymType || null,
      preferredSets: formData.preferredSets || null,
      preferredRepRange: formData.preferredRepRange || null,
      restTime: formData.restTime || null,
    };

    await db.studentProfile.upsert({
      where: { studentId: student.id },
      create: profileData,
      update: profileData,
    });

    if (!student.progress) {
      await db.studentProgress.create({
        data: {
          studentId: student.id,
        },
      });
    }

    // Inicializar trial de 14 dias automaticamente
    await initializeStudentTrial(student.id);

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar perfil:", error);
    return { success: false, error: error.message || "Erro ao salvar perfil" };
  }
}
