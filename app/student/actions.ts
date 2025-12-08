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
