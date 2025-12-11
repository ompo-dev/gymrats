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
    if (!session || !session.user.student) {
      return null;
    }

    const subscription = await db.subscription.findUnique({
      where: { studentId: session.user.student.id },
    });

    if (!subscription) {
      return null;
    }

    // Se a subscription está cancelada, retornar null para permitir assinar novamente
    if (subscription.status === "canceled") {
      return null;
    }

    const now = new Date();
    const trialEndDate = subscription.trialEnd ? new Date(subscription.trialEnd) : null;
    const isTrialActive = trialEndDate ? trialEndDate > now : false;
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
    if (!session || !session.user.student) {
      return { error: "Aluno não encontrado" };
    }

    const existingSubscription = await db.subscription.findUnique({
      where: { studentId: session.user.student.id },
    });

    if (existingSubscription) {
      // Se já existe trial ativo, retornar sucesso com a assinatura existente
      if (existingSubscription.trialEnd && new Date(existingSubscription.trialEnd) > new Date()) {
        return { success: true, subscription: existingSubscription };
      }
      return { error: "Você já possui uma assinatura. Gerencie sua assinatura na página de pagamentos." };
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const subscription = await db.subscription.create({
      data: {
        studentId: session.user.student.id,
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