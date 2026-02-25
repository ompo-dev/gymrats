import { db } from "@/lib/db";

export class GymMemberService {
  /**
   * Lista os alunos da academia
   */
  static async getStudents(gymId: string) {
    const memberships = await db.gymMembership.findMany({
      where: { gymId },
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

    return memberships.map((m) => {
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
        gender: student.gender as any,
        phone: student.phone || "",
        membershipStatus: m.status as any,
        joinDate: m.createdAt,
        currentStreak: progress?.currentStreak || 0,
        currentWeight: profile?.weight ?? 0,
        profile: profile ? {
          id: student.id,
          name: user.name,
          height: profile.height ?? 0,
          weight: profile.weight ?? 0,
          fitnessLevel: profile.fitnessLevel as any,
          goals: profile.goals ? JSON.parse(profile.goals) : [],
        } : undefined,
        progress: progress ? {
          currentStreak: progress.currentStreak,
          totalXP: progress.totalXP,
          currentLevel: progress.currentLevel,
        } : undefined,
      };
    });
  }

  static async getStudentById(gymId: string, studentId: string) {
    const membership = await db.gymMembership.findFirst({
      where: {
        gymId,
        studentId,
      },
      include: {
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
              take: 5,
              include: {
                exercises: true,
              },
            },
          },
        },
        plan: true,
      },
    });

    if (!membership) return null;

    const { student } = membership;
    const studentData = {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      avatar: student.avatar || student.user.image,
      age: student.age,
      gender: student.gender,
      phone: student.phone,
      joinDate: membership.createdAt,
      status: membership.status as any,
      membershipStatus: membership.status as any,
      plan: membership.plan?.name || "Sem plano",
      profile: student.profile
        ? {
            height: student.profile.height,
            weight: student.profile.weight,
            fitnessLevel: student.profile.fitnessLevel,
            goals: student.profile.goals ? JSON.parse(student.profile.goals) : [],
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
      recentWorkouts: student.workouts.map((wh: any) => ({
        id: wh.id,
        date: wh.date,
        duration: wh.duration,
        exercises: wh.exercises.map((ex: any) => ({
          name: ex.exerciseName,
          sets: JSON.parse(ex.sets),
        })),
      })),
      weightHistory: (student as any).weightHistory?.map((wh: { date: Date; weight: number }) => ({
        date: wh.date,
        weight: wh.weight,
      })) ?? [],
      gymMembership: {
        id: membership.id,
        status: membership.status,
        planId: membership.planId,
      },
    };

    return studentData;
  }

  /**
   * Busca check-ins recentes da academia
   */
  static async getRecentCheckIns(gymId: string) {
    const checkIns = await db.checkIn.findMany({
      where: { gymId },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    return checkIns.map((ci) => ({
      id: ci.id,
      studentId: ci.studentId,
      studentName: ci.studentName,
      timestamp: ci.timestamp,
      checkOut: ci.checkOut,
    }));
  }
}
