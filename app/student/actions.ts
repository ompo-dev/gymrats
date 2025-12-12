"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";
import { mockUnits } from "@/lib/mock-data";
import { mockGymLocations } from "@/lib/gym-mock-data";
import { mockUserProgress } from "@/lib/mock-data";

export async function getStudentProfile() {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return { hasProfile: false, profile: null };
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return { hasProfile: false, profile: null };
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        student: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!user || !user.student) {
      return { hasProfile: false, profile: null };
    }

    const hasProfile =
      !!user.student.profile &&
      user.student.profile.height !== null &&
      user.student.profile.weight !== null &&
      user.student.profile.fitnessLevel !== null;

    return {
      hasProfile,
      profile: user.student.profile
        ? {
            height: user.student.profile.height,
            weight: user.student.profile.weight,
            fitnessLevel: user.student.profile.fitnessLevel,
            weeklyWorkoutFrequency: user.student.profile.weeklyWorkoutFrequency,
            workoutDuration: user.student.profile.workoutDuration,
            goals: user.student.profile.goals
              ? JSON.parse(user.student.profile.goals)
              : [],
            availableEquipment: user.student.profile.availableEquipment
              ? JSON.parse(user.student.profile.availableEquipment)
              : [],
            gymType: user.student.profile.gymType,
            preferredWorkoutTime: user.student.profile.preferredWorkoutTime,
            preferredSets: user.student.profile.preferredSets,
            preferredRepRange: user.student.profile.preferredRepRange,
            restTime: user.student.profile.restTime,
          }
        : null,
    };
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return { hasProfile: false, profile: null };
  }
}

export async function getStudentProgress() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return mockUserProgress;
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return mockUserProgress;
    }

    const progress = await db.studentProgress.findUnique({
      where: { studentId: session.user.student.id },
    });

    if (!progress) {
      return mockUserProgress;
    }

    return {
      currentStreak: progress.currentStreak || 0,
      longestStreak: progress.longestStreak || 0,
      totalXP: progress.totalXP || 0,
      currentLevel: progress.currentLevel || 1,
      xpToNextLevel: progress.xpToNextLevel || 0,
      workoutsCompleted: progress.workoutsCompleted || 0,
      todayXP: progress.todayXP || 0,
    };
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    return mockUserProgress;
  }
}

export async function getStudentUnits() {
  return mockUnits;
}

export async function getGymLocations() {
  return mockGymLocations;
}

export async function getStudentSubscription() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return null;
    }

    // Se for ADMIN, garantir que tenha perfil de student
    let studentId: string | null = null;
    if (session.user.role === "ADMIN") {
      const existingStudent = await db.student.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!existingStudent) {
        const newStudent = await db.student.create({
          data: {
            userId: session.user.id,
          },
        });
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }
    } else if (session.user.student?.id) {
      studentId = session.user.student.id;
    }

    if (!studentId) {
      return null;
    }

    const subscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (!subscription) {
      console.log(`[getStudentSubscription] Nenhuma subscription encontrada para studentId: ${studentId}`);
      return null;
    }

    console.log(`[getStudentSubscription] Subscription encontrada:`, {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plan,
      trialEnd: subscription.trialEnd,
    });

    const now = new Date();
    const trialEndDate = subscription.trialEnd ? new Date(subscription.trialEnd) : null;
    const isTrialActive = trialEndDate ? trialEndDate > now : false;

    // Se a subscription está cancelada mas o trial ainda está ativo, retornar os dados
    // Só retornar null se estiver cancelada E não houver trial ativo
    if (subscription.status === "canceled" && !isTrialActive) {
      console.log(`[getStudentSubscription] Subscription cancelada e trial expirado, retornando null`);
      return null;
    }
    const daysRemaining = trialEndDate
      ? Math.max(
          0,
          Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        )
      : null;

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
      isTrial: isTrialActive,
      daysRemaining,
    };
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error);
    return null;
  }
}

export async function startStudentTrial() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return { error: "Não autenticado" };
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return { error: "Sessão inválida" };
    }

    // Se for ADMIN, garantir que tenha perfil de student
    let studentId: string | null = null;
    if (session.user.role === "ADMIN") {
      const existingStudent = await db.student.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!existingStudent) {
        const newStudent = await db.student.create({
          data: {
            userId: session.user.id,
          },
        });
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }
    } else if (session.user.student?.id) {
      studentId = session.user.student.id;
    }

    if (!studentId) {
      return { error: "Aluno não encontrado" };
    }

    const existingSubscription = await db.subscription.findUnique({
      where: { studentId },
    });

    if (existingSubscription) {
      const now = new Date();
      const trialEndDate = existingSubscription.trialEnd ? new Date(existingSubscription.trialEnd) : null;
      const isTrialActive = trialEndDate ? trialEndDate > now : false;
      
      // Se está cancelada e o trial expirou, permitir criar nova
      if (existingSubscription.status === "canceled" && !isTrialActive) {
        // Deletar a subscription cancelada para permitir criar nova
        await db.subscription.delete({
          where: { id: existingSubscription.id },
        });
      } else if (existingSubscription.status === "canceled" && isTrialActive) {
        // Se está cancelada mas trial ainda ativo, reativar
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14);
        
        const updatedSubscription = await db.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: "trialing",
            canceledAt: null,
            cancelAtPeriodEnd: false,
            trialStart: now,
            trialEnd: trialEnd,
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
          },
        });
        
        return { success: true, subscription: updatedSubscription };
      } else if (isTrialActive) {
        // Se já existe trial ativo, retornar sucesso com a assinatura existente
        return { success: true, subscription: existingSubscription };
      } else {
        // Se já existe e está ativa, retornar erro
        return { error: "Você já possui uma assinatura. Gerencie sua assinatura na página de pagamentos." };
      }
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.subscription.create({
      data: {
        studentId,
        plan: "premium",
        status: "trialing",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd: trialEnd,
      },
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Erro ao iniciar trial:", error);
    return { error: "Erro ao iniciar trial" };
  }
}