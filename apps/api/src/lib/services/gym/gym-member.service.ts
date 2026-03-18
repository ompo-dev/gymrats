import { db } from "@/lib/db";
import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";

const GYM_RECENT_CHECKINS_CACHE_TTL_SECONDS = 10;

function buildGymMemberCacheKey(
  gymId: string,
  resource: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const query = Object.entries(params ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return query.length > 0
    ? `gym:member:${gymId}:${resource}:${query}`
    : `gym:member:${gymId}:${resource}`;
}

export class GymMemberService {
  /**
   * Lista os alunos da academia
   */
  static async getStudents(gymId: string) {
    const memberships = await db.gymMembership.findMany({
      where: {
        gymId,
        status: { in: ["active", "pending"] },
      },
      include: {
        student: {
          include: {
            user: true,
            profile: true,
            progress: true,
          },
        },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedMemberships = memberships.map((m) => {
      const { student } = m;
      const { user } = student;
      const { profile } = student;
      const { progress } = student;

      return {
        id: student.id,
        name: user.name,
        email: user.email,
        avatar: student.avatar || user.image || undefined,
        age: student.age ?? 0,
        gender: student.gender ?? "",
        phone: student.phone || "",
        membershipStatus: m.status,
        joinDate: m.createdAt,
        currentStreak: progress?.currentStreak || 0,
        currentWeight: profile?.weight ?? 0,
        profile: profile
          ? {
              id: student.id,
              name: user.name,
              height: profile.height ?? 0,
              weight: profile.weight ?? 0,
              fitnessLevel: profile.fitnessLevel ?? "iniciante",
              goals: profile.goals ? JSON.parse(profile.goals) : [],
            }
          : undefined,
        progress: progress
          ? {
              currentStreak: progress.currentStreak,
              totalXP: progress.totalXP,
              currentLevel: progress.currentLevel,
            }
          : undefined,
      };
    });

    const networkAccesses = await db.proGymAccess.findMany({
      where: { gymId },
      distinct: ["studentId"],
      include: {
        student: {
          include: { user: true, profile: true, progress: true },
        },
      },
    });

    const mappedNetworkAccesses = networkAccesses.map(
      (a: (typeof networkAccesses)[0]) => {
        const { student } = a;
        const { user } = student;
        const { profile } = student;
        const { progress } = student;

        return {
          id: student.id,
          name: user.name,
          email: user.email,
          avatar: student.avatar || user.image || undefined,
          age: student.age ?? 0,
          gender: student.gender ?? "",
          phone: student.phone || "",
          membershipStatus: "network_pro" as any, // Adicionamos status especial
          joinDate: a.createdAt,
          currentStreak: progress?.currentStreak || 0,
          currentWeight: profile?.weight ?? 0,
          profile: profile
            ? {
                id: student.id,
                name: user.name,
                height: profile.height ?? 0,
                weight: profile.weight ?? 0,
                fitnessLevel: profile.fitnessLevel ?? "iniciante",
                goals: profile.goals ? JSON.parse(profile.goals) : [],
              }
            : undefined,
          progress: progress
            ? {
                currentStreak: progress.currentStreak,
                totalXP: progress.totalXP,
                currentLevel: progress.currentLevel,
              }
            : undefined,
        };
      },
    );

    return [...mappedMemberships, ...mappedNetworkAccesses];
  }

  static async getStudentById(gymId: string, studentId: string) {
    const membership = await db.gymMembership.findFirst({
      where: {
        gymId,
        studentId,
        status: { in: ["active", "pending"] },
      },
      include: {
        gym: { select: { name: true, address: true } },
        student: {
          include: {
            user: true,
            profile: true,
            progress: true,
            weightHistory: {
              orderBy: { date: "desc" },
              take: 50,
            },
            workouts: {
              orderBy: { date: "desc" },
              take: 50,
              include: {
                exercises: true,
                workout: { select: { id: true, title: true } },
              },
            },
          },
        },
        plan: true,
      },
    });

    if (!membership) return null;

    const { student } = membership;
    const weightHistoryList = student.weightHistory ?? [];
    const goals: string[] = student.profile?.goals
      ? JSON.parse(student.profile.goals)
      : [];
    const hasWeightLossGoal = goals.includes("perder-peso");
    const currentWeight = student.profile?.weight ?? 0;
    const oldestWeight =
      weightHistoryList.length > 0
        ? weightHistoryList[weightHistoryList.length - 1]?.weight
        : null;
    const weightGain =
      currentWeight && oldestWeight != null
        ? currentWeight - oldestWeight
        : null;

    const workoutHistory = student.workouts.map((wh) => {
      const setsParsed = (ex: { sets: string }) => {
        try {
          const s = JSON.parse(ex.sets);
          return Array.isArray(s)
            ? s.map((set: { weight?: number; reps?: number }, i: number) => ({
                setNumber: i + 1,
                weight: set.weight ?? 0,
                reps: set.reps ?? 0,
                completed: true,
              }))
            : [];
        } catch {
          return [];
        }
      };
      return {
        date: wh.date,
        workoutId: wh.workoutId ?? "",
        workoutName: wh.workout?.title ?? "Treino",
        duration: wh.duration ?? 0,
        totalVolume: wh.totalVolume ?? 0,
        exercises: wh.exercises.map((ex) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          workoutId: wh.workoutId ?? "",
          date: wh.date,
          sets: setsParsed(ex),
          notes: ex.notes ?? undefined,
          formCheckScore: ex.formCheckScore ?? undefined,
          difficulty: ex.difficulty ?? "ideal",
        })),
        overallFeedback: wh.overallFeedback ?? undefined,
        bodyPartsFatigued: wh.bodyPartsFatigued
          ? (JSON.parse(wh.bodyPartsFatigued) as string[])
          : [],
      };
    });

    const workoutsCompleted = student.progress?.workoutsCompleted ?? 0;
    const totalVisits = Math.max(workoutsCompleted, workoutHistory.length);
    const weeklyFreq = student.profile?.weeklyWorkoutFrequency ?? 3;
    const expectedMonthly = weeklyFreq * 4;
    const attendanceRate =
      expectedMonthly > 0
        ? Math.min(100, Math.round((totalVisits / expectedMonthly) * 100))
        : 0;

    const availableEquipment = student.profile?.availableEquipment
      ? (JSON.parse(student.profile.availableEquipment) as string[])
      : [];
    const favoriteEquipment = availableEquipment;

    const personalsAssignments =
      await StudentPersonalService.listPersonalsByStudent(student.id);
    const assignedPersonals = personalsAssignments.map((a) => ({
      id: a.personal.id,
      name: a.personal.name,
      email: a.personal.email ?? undefined,
      gym: a.gym ? { id: a.gym.id, name: a.gym.name } : undefined,
    }));

    const studentData = {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      avatar: student.avatar || student.user.image,
      age: student.age ?? 0,
      gender: student.gender ?? "",
      phone: student.phone ?? "",
      joinDate: membership.createdAt,
      status: membership.status,
      membershipStatus: membership.status,
      plan: membership.plan?.name || "Sem plano",
      profile: student.profile
        ? {
            height: student.profile.height ?? 0,
            weight: student.profile.weight ?? 0,
            fitnessLevel: student.profile.fitnessLevel ?? "iniciante",
            goals,
            weeklyWorkoutFrequency: student.profile.weeklyWorkoutFrequency ?? 3,
            targetCalories: student.profile.targetCalories ?? 2000,
            targetProtein: student.profile.targetProtein ?? 150,
            targetCarbs: student.profile.targetCarbs ?? 250,
            targetFats: student.profile.targetFats ?? 65,
          }
        : null,
      currentStreak: student.progress?.currentStreak ?? 0,
      progress: student.progress
        ? {
            currentLevel: student.progress.currentLevel,
            totalXP: student.progress.totalXP,
            workoutsCompleted: student.progress.workoutsCompleted,
          }
        : null,
      recentWorkouts: student.workouts.slice(0, 5).map((wh) => ({
        id: wh.id,
        date: wh.date,
        duration: wh.duration,
        exercises: wh.exercises.map((ex) => ({
          name: ex.exerciseName,
          sets: (() => {
            try {
              return JSON.parse(ex.sets);
            } catch {
              return [];
            }
          })(),
        })),
      })),
      workoutHistory,
      weightHistory: weightHistoryList.map(
        (wh: { date: Date; weight: number }) => ({
          date: wh.date,
          weight: wh.weight,
        }),
      ),
      weightGain,
      hasWeightLossGoal,
      totalVisits,
      attendanceRate,
      favoriteEquipment,
      currentWeight,
      gymMembership: {
        id: membership.id,
        gymId: membership.gymId,
        gymName: membership.gym?.name ?? "",
        gymAddress: membership.gym?.address ?? "",
        planId: membership.planId ?? "",
        planName: membership.plan?.name ?? "",
        planType: membership.plan?.type ?? "monthly",
        startDate: membership.startDate,
        nextBillingDate: membership.nextBillingDate ?? undefined,
        amount: membership.amount,
        status: membership.status,
        autoRenew: membership.autoRenew,
        benefits: [],
      },
      assignedPersonals,
    };

    return studentData;
  }

  /**
   * Busca check-ins recentes da academia
   */
  static async getRecentCheckIns(
    gymId: string,
    options?: { fresh?: boolean },
  ) {
    const cacheKey = buildGymMemberCacheKey(gymId, "recent-checkins");

    if (!options?.fresh) {
      const cached = await getCachedJson<
        Array<{
          id: string;
          studentId: string;
          studentName: string;
          timestamp: Date | string;
          checkOut: Date | string | null;
        }>
      >(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const checkIns = await db.checkIn.findMany({
      where: { gymId },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    const payload = checkIns.map((ci) => ({
      id: ci.id,
      studentId: ci.studentId,
      studentName: ci.studentName,
      timestamp: ci.timestamp,
      checkOut: ci.checkOut,
    }));

    await setCachedJson(
      cacheKey,
      payload,
      GYM_RECENT_CHECKINS_CACHE_TTL_SECONDS,
    );

    return payload;
  }
}
