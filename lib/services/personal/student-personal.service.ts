import { db } from "@/lib/db";
import type { StudentData } from "@/lib/types";

export class StudentPersonalService {
  static async searchStudentByEmail(personalId: string, email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedIdentifier = normalizedEmail.startsWith("@")
      ? normalizedEmail.slice(1)
      : normalizedEmail;
    const isFullEmail = normalizedIdentifier.includes("@");

    const emailWhere = isFullEmail
      ? { contains: normalizedIdentifier, mode: "insensitive" as const }
      : {
          startsWith: `${normalizedIdentifier}@`,
          mode: "insensitive" as const,
        };

    const user = await db.user.findFirst({
      where: {
        email: emailWhere,
        role: { in: ["STUDENT", "ADMIN"] },
      },
      include: {
        student: {
          include: {
            profile: true,
            progress: true,
            personalAssignments: {
              where: {
                personalId,
                status: "active",
              },
            },
          },
        },
      },
    });

    if (!user?.student) {
      return { found: false };
    }

    const existingAssignment = user.student.personalAssignments[0];
    return {
      found: true,
      isAlreadyAssigned: !!existingAssignment,
      student: {
        id: user.student.id,
        name: user.name,
        email: user.email,
        avatar: user.student.avatar,
        age: user.student.age,
        gender: user.student.gender,
        currentLevel: user.student.progress?.currentLevel ?? 1,
        currentStreak: user.student.progress?.currentStreak ?? 0,
      },
    };
  }
  static async assignByGym(input: {
    studentId: string;
    personalId: string;
    gymId: string;
  }) {
    const { studentId, personalId, gymId } = input;

    const affiliation = await db.gymPersonalAffiliation.findUnique({
      where: { personalId_gymId: { personalId, gymId } },
      select: { status: true },
    });
    if (!affiliation || affiliation.status !== "active") {
      throw new Error("Personal não está filiado à academia");
    }

    const existing = await db.studentPersonalAssignment.findUnique({
      where: { studentId_personalId: { studentId, personalId } },
    });

    if (existing) {
      return db.studentPersonalAssignment.update({
        where: { id: existing.id },
        data: {
          gymId,
          assignedBy: "GYM",
          status: "active",
        },
      });
    }

    return db.studentPersonalAssignment.create({
      data: {
        studentId,
        personalId,
        gymId,
        assignedBy: "GYM",
        status: "active",
      },
    });
  }

  static async assignByPersonal(input: {
    studentId: string;
    personalId: string;
    gymId?: string;
  }) {
    const { studentId, personalId, gymId } = input;

    if (gymId) {
      const affiliation = await db.gymPersonalAffiliation.findUnique({
        where: { personalId_gymId: { personalId, gymId } },
        select: { status: true },
      });
      if (!affiliation || affiliation.status !== "active") {
        throw new Error("Personal não está filiado à academia informada");
      }
    }

    const existing = await db.studentPersonalAssignment.findUnique({
      where: { studentId_personalId: { studentId, personalId } },
    });

    if (existing) {
      return db.studentPersonalAssignment.update({
        where: { id: existing.id },
        data: {
          gymId: gymId ?? null,
          assignedBy: "PERSONAL",
          status: "active",
        },
      });
    }

    return db.studentPersonalAssignment.create({
      data: {
        studentId,
        personalId,
        gymId: gymId ?? null,
        assignedBy: "PERSONAL",
        status: "active",
      },
    });
  }

  static async removeAssignment(input: { studentId: string; personalId: string }) {
    const { studentId, personalId } = input;

    const existing = await db.studentPersonalAssignment.findUnique({
      where: { studentId_personalId: { studentId, personalId } },
    });
    if (!existing) return null;

    return db.studentPersonalAssignment.update({
      where: { id: existing.id },
      data: { status: "removed" },
    });
  }

  static async listPersonalsByStudent(studentId: string) {
    return db.studentPersonalAssignment.findMany({
      where: { studentId, status: "active" },
      include: {
        personal: true,
        gym: {
          select: { id: true, name: true, image: true, logo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getStudentDetailForPersonal(
    personalId: string,
    studentId: string,
  ) {
    const assignment = await db.studentPersonalAssignment.findFirst({
      where: {
        studentId,
        personalId,
        status: "active",
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: true,
            progress: true,
            records: {
              orderBy: { date: "desc" },
              take: 50,
              select: {
                exerciseName: true,
                date: true,
                value: true,
                type: true,
              },
            },
          },
        },
        gym: { select: { id: true, name: true } },
      },
    });
    return assignment;
  }

  static async listStudentsByPersonal(personalId: string, gymId?: string) {
    return db.studentPersonalAssignment.findMany({
      where: {
        personalId,
        status: "active",
        ...(gymId ? { gymId } : {}),
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: true,
            progress: true,
          },
        },
        gym: {
          select: { id: true, name: true, image: true, logo: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Lista alunos do personal no formato StudentData[] para uso com GymStudentsPage.
   */
  static async listStudentsAsStudentData(
    personalId: string,
    gymId?: string,
  ): Promise<StudentData[]> {
    const assignments = await this.listStudentsByPersonal(personalId, gymId);
    const result: StudentData[] = [];

    const parseJson = <T>(s: string | null | undefined, fallback: T): T => {
      if (!s) return fallback;
      try {
        return JSON.parse(s) as T;
      } catch {
        return fallback;
      }
    };

    for (const a of assignments) {
      const { student } = a;
      const profile = student.profile;
      const progress = student.progress;
      const goals: string[] = parseJson(profile?.goals, []);
      const workoutsCompleted = progress?.workoutsCompleted ?? 0;
      const weeklyFreq = profile?.weeklyWorkoutFrequency ?? 3;
      const expectedMonthly = weeklyFreq * 4;
      const attendanceRate =
        expectedMonthly > 0
          ? Math.min(100, Math.round((workoutsCompleted / expectedMonthly) * 100))
          : 0;

      result.push({
        id: student.id,
        name: student.user?.name ?? "",
        email: student.user?.email ?? "",
        avatar: student.avatar ?? undefined,
        age: student.age ?? 0,
        gender: student.gender ?? "",
        phone: student.phone ?? "",
        membershipStatus: a.status === "active" ? "active" : "inactive",
        joinDate: a.createdAt,
        totalVisits: workoutsCompleted,
        currentStreak: progress?.currentStreak ?? 0,
        profile: profile
          ? {
              id: student.id,
              name: student.user?.name ?? "",
              age: student.age ?? 0,
              gender: (student.gender as "male" | "female" | "non-binary" | "prefer-not-to-say") ?? "prefer-not-to-say",
              height: profile.height ?? 0,
              weight: profile.weight ?? 0,
              fitnessLevel: (profile.fitnessLevel as "iniciante" | "intermediario" | "avancado") ?? "iniciante",
              weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency ?? 3,
              workoutDuration: profile.workoutDuration ?? 60,
              goals: goals as ("perder-peso" | "ganhar-massa" | "definir" | "saude" | "forca" | "resistencia")[],
              injuries: parseJson<string[]>(profile.injuries, []),
              availableEquipment: parseJson<string[]>(profile.availableEquipment, []),
              gymType: (profile.gymType as "academia-completa" | "academia-basica" | "home-gym" | "peso-corporal") ?? "academia-completa",
              preferredWorkoutTime: (profile.preferredWorkoutTime as "manha" | "tarde" | "noite") ?? "manha",
              preferredSets: profile.preferredSets ?? 3,
              preferredRepRange: (profile.preferredRepRange as "forca" | "hipertrofia" | "resistencia") ?? "hipertrofia",
              restTime: (profile.restTime as "curto" | "medio" | "longo") ?? "medio",
              targetCalories: profile.targetCalories ?? 2000,
              targetProtein: profile.targetProtein ?? 150,
              targetCarbs: profile.targetCarbs ?? 250,
              targetFats: profile.targetFats ?? 65,
            }
          : {
              id: student.id,
              name: student.user?.name ?? "",
              age: student.age ?? 0,
              gender: "prefer-not-to-say" as const,
              height: 0,
              weight: 0,
              fitnessLevel: "iniciante" as const,
              weeklyWorkoutFrequency: 3,
              workoutDuration: 60,
              goals: [],
              injuries: [],
              availableEquipment: [],
              gymType: "academia-completa" as const,
              preferredWorkoutTime: "manha" as const,
              preferredSets: 3,
              preferredRepRange: "hipertrofia" as const,
              restTime: "medio" as const,
              targetCalories: 2000,
              targetProtein: 150,
              targetCarbs: 250,
              targetFats: 65,
            },
        progress: progress
          ? {
              currentStreak: progress.currentStreak,
              longestStreak: progress.longestStreak,
              totalXP: progress.totalXP,
              currentLevel: progress.currentLevel,
              xpToNextLevel: progress.xpToNextLevel,
              workoutsCompleted: progress.workoutsCompleted,
              achievements: [],
              lastActivityDate: progress.lastActivityDate?.toISOString() ?? "",
              dailyGoalXP: progress.dailyGoalXP,
              weeklyXP: [],
              todayXP: progress.todayXP,
            }
          : {
              currentStreak: 0,
              longestStreak: 0,
              totalXP: 0,
              currentLevel: 1,
              xpToNextLevel: 100,
              workoutsCompleted: 0,
              achievements: [],
              lastActivityDate: "",
              dailyGoalXP: 100,
              weeklyXP: [],
              todayXP: 0,
            },
        workoutHistory: [],
        personalRecords: [],
        currentWeight: profile?.weight ?? 0,
        weightHistory: [],
        attendanceRate,
        favoriteEquipment: parseJson<string[]>(profile?.availableEquipment, []),
        gymMembership: a.gym
          ? {
              id: a.id,
              gymId: a.gym.id,
              gymName: a.gym.name,
              gymAddress: "",
              planId: "",
              planName: "Via academia",
              planType: "monthly",
              startDate: a.createdAt,
              nextBillingDate: undefined,
              amount: 0,
              status: "active",
              autoRenew: false,
              benefits: [],
            }
          : undefined,
      });
    }

    return result;
  }

  /**
   * Retorna o aluno no formato StudentData para uso com GymStudentDetail.
   */
  static async getStudentByIdAsStudentData(
    personalId: string,
    studentId: string,
  ): Promise<StudentData | null> {
    const assignment = await db.studentPersonalAssignment.findFirst({
      where: {
        studentId,
        personalId,
        status: "active",
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            profile: true,
            progress: true,
            records: {
              orderBy: { date: "desc" },
              take: 50,
              select: {
                exerciseId: true,
                exerciseName: true,
                date: true,
                value: true,
                type: true,
              },
            },
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
        gym: { select: { id: true, name: true } },
      },
    });

    if (!assignment) return null;

    const { student } = assignment;
    const profile = student.profile;
    const progress = student.progress;
    const goals: string[] = profile?.goals
      ? (JSON.parse(profile.goals) as string[])
      : [];
    const weightHistoryList = student.weightHistory ?? [];
    const currentWeight = profile?.weight ?? 0;
    const oldestWeight =
      weightHistoryList.length > 0
        ? weightHistoryList[weightHistoryList.length - 1]?.weight
        : null;
    const weightGain =
      currentWeight && oldestWeight != null
        ? currentWeight - oldestWeight
        : null;
    const workoutsCompleted = progress?.workoutsCompleted ?? 0;
    const totalVisits = Math.max(
      workoutsCompleted,
      student.workouts?.length ?? 0,
    );
    const weeklyFreq = profile?.weeklyWorkoutFrequency ?? 3;
    const expectedMonthly = weeklyFreq * 4;
    const attendanceRate =
      expectedMonthly > 0
        ? Math.min(100, Math.round((totalVisits / expectedMonthly) * 100))
        : 0;

    const workoutHistory = (student.workouts ?? []).map((wh) => {
      const setsParsed = (ex: { sets: string }) => {
        try {
          const s = JSON.parse(ex.sets);
          return Array.isArray(s)
            ? s.map(
                (
                  set: { weight?: number; reps?: number },
                  i: number,
                ) => ({
                  setNumber: i + 1,
                  weight: set.weight ?? 0,
                  reps: set.reps ?? 0,
                  completed: true,
                }),
              )
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

    const studentData: StudentData = {
      id: student.id,
      name: student.user?.name ?? "",
      email: student.user?.email ?? "",
      avatar: student.avatar ?? undefined,
      age: student.age ?? 0,
      gender: student.gender ?? "",
      phone: student.phone ?? "",
      membershipStatus:
        assignment.status === "active" ? "active" : "inactive",
      joinDate: assignment.createdAt,
      totalVisits,
      currentStreak: progress?.currentStreak ?? 0,
      profile: profile
        ? {
            id: student.id,
            name: student.user?.name ?? "",
            height: profile.height ?? 0,
            weight: profile.weight ?? 0,
            fitnessLevel: profile.fitnessLevel ?? "iniciante",
            goals,
            weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency ?? 3,
            targetCalories: profile.targetCalories ?? 2000,
            targetProtein: profile.targetProtein ?? 150,
            targetCarbs: profile.targetCarbs ?? 250,
            targetFats: profile.targetFats ?? 65,
          }
        : {
            id: student.id,
            name: student.user?.name ?? "",
            height: 0,
            weight: 0,
            fitnessLevel: "iniciante",
            goals: [],
            weeklyWorkoutFrequency: 3,
            targetCalories: 2000,
            targetProtein: 150,
            targetCarbs: 250,
            targetFats: 65,
          },
      progress: progress
        ? {
            currentLevel: progress.currentLevel,
            totalXP: progress.totalXP,
            workoutsCompleted: progress.workoutsCompleted,
          }
        : {
            currentLevel: 1,
            totalXP: 0,
            workoutsCompleted: 0,
          },
      recentWorkouts: (student.workouts ?? []).slice(0, 5).map((wh) => ({
        id: wh.id,
        date: wh.date,
        duration: wh.duration ?? 0,
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
      weightHistory: weightHistoryList.map((wh) => ({
        date: wh.date,
        weight: wh.weight,
      })),
      weightGain,
      hasWeightLossGoal: goals.includes("perder-peso"),
      attendanceRate,
      favoriteEquipment: profile?.availableEquipment
        ? (JSON.parse(profile.availableEquipment) as string[])
        : [],
      currentWeight,
      personalRecords: (student.records ?? []).map((r) => ({
        exerciseId: r.exerciseId ?? "",
        exerciseName: r.exerciseName ?? "",
        date: r.date,
        value: r.value ?? 0,
        type: (r.type as "max-weight" | "max-reps" | "max-volume") ?? "max-weight",
      })),
      gymMembership: assignment.gym
        ? {
            id: assignment.id,
            gymId: assignment.gym.id,
            gymName: assignment.gym.name,
            gymAddress: "",
            planId: "",
            planName: "Via academia",
            planType: "monthly",
            startDate: assignment.createdAt,
            nextBillingDate: undefined,
            amount: 0,
            status: "active",
            autoRenew: false,
            benefits: [],
          }
        : undefined,
    };

    return studentData;
  }
}
