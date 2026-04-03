import type { Prisma } from "@prisma/client";
import { getCachedJson, setCachedJson } from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import { parseJsonArray, parseJsonSafe } from "@/lib/utils/json";
import type {
  ExerciseLog,
  MuscleGroup,
  StudentData,
  UserProfile,
  UserProgress,
  WorkoutHistory,
} from "@/lib/types";

const PERSONAL_STUDENTS_CACHE_TTL_SECONDS = 20;

const personalStudentListInclude = {
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
} satisfies Prisma.StudentPersonalAssignmentInclude;

type PersonalStudentListAssignment =
  Prisma.StudentPersonalAssignmentGetPayload<{
    include: typeof personalStudentListInclude;
  }>;

function buildPersonalStudentCacheKey(
  personalId: string,
  resource: string,
  params?: Record<string, string | number | boolean | null | undefined>,
) {
  const query = Object.entries(params ?? {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return query.length > 0
    ? `personal:students:${personalId}:${resource}:${query}`
    : `personal:students:${personalId}:${resource}`;
}

const EXERCISE_DIFFICULTY = [
  "muito-facil",
  "facil",
  "ideal",
  "dificil",
  "muito-dificil",
] as const;
type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTY)[number];

function toExerciseDifficulty(
  v: string | null | undefined,
): ExerciseDifficulty {
  if (v && EXERCISE_DIFFICULTY.includes(v as ExerciseDifficulty))
    return v as ExerciseDifficulty;
  return "ideal";
}

function toMuscleGroups(arr: unknown): MuscleGroup[] {
  const valid: MuscleGroup[] = [
    "peito",
    "costas",
    "pernas",
    "ombros",
    "bracos",
    "core",
    "gluteos",
    "cardio",
    "funcional",
  ];
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (x): x is MuscleGroup =>
      typeof x === "string" && valid.includes(x as MuscleGroup),
  );
}

const VALID_GOALS = [
  "perder-peso",
  "ganhar-massa",
  "definir",
  "saude",
  "forca",
  "resistencia",
] as const;
type GoalType = (typeof VALID_GOALS)[number];

function toGoals(arr: unknown): UserProfile["goals"] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (x): x is GoalType =>
      typeof x === "string" && VALID_GOALS.includes(x as GoalType),
  );
}

const VALID_FEEDBACK = ["excelente", "bom", "regular", "ruim"] as const;
type FeedbackType = (typeof VALID_FEEDBACK)[number];

function toOverallFeedback(
  v: string | null | undefined,
): FeedbackType | undefined {
  if (!v) return undefined;
  if (VALID_FEEDBACK.includes(v as FeedbackType)) return v as FeedbackType;
  return undefined;
}

function buildUserProfile(
  student: {
    id: string;
    user?: { name: string | null } | null;
    age: number | null;
    gender: string | null;
  },
  profile: {
    height?: number | null;
    weight?: number | null;
    fitnessLevel?: string | null;
    weeklyWorkoutFrequency?: number | null;
    targetCalories?: number | null;
    targetProtein?: number | null;
    targetCarbs?: number | null;
    targetFats?: number | null;
    availableEquipment?: string | null;
  } | null,
  goals: UserProfile["goals"],
): UserProfile {
  const availableEquipment = parseJsonArray<unknown>(profile?.availableEquipment)
    .filter((x): x is string => typeof x === "string");
  const gender = (
    ["male", "female", "non-binary", "prefer-not-to-say"].includes(
      student.gender ?? "",
    )
      ? student.gender
      : "prefer-not-to-say"
  ) as UserProfile["gender"];
  return {
    id: student.id,
    name: student.user?.name ?? "",
    age: student.age ?? 0,
    gender,
    height: profile?.height ?? 0,
    weight: profile?.weight ?? 0,
    fitnessLevel: (profile?.fitnessLevel ??
      "iniciante") as UserProfile["fitnessLevel"],
    weeklyWorkoutFrequency: profile?.weeklyWorkoutFrequency ?? 3,
    workoutDuration: 45,
    goals,
    availableEquipment,
    gymType: "academia-completa",
    preferredWorkoutTime: "tarde",
    preferredSets: 3,
    preferredRepRange: "hipertrofia",
    restTime: "medio",
    targetCalories: profile?.targetCalories ?? 2000,
    targetProtein: profile?.targetProtein ?? 150,
    targetCarbs: profile?.targetCarbs ?? 250,
    targetFats: profile?.targetFats ?? 65,
  };
}

function buildUserProgress(
  progress: {
    currentLevel?: number;
    totalXP?: number;
    workoutsCompleted?: number;
    currentStreak?: number;
    longestStreak?: number;
    xpToNextLevel?: number;
    lastActivityDate?: Date | null;
    dailyGoalXP?: number;
    todayXP?: number;
  } | null,
): UserProgress {
  const level = progress?.currentLevel ?? 1;
  const totalXP = progress?.totalXP ?? 0;
  const xpToNextLevel =
    progress?.xpToNextLevel ?? Math.max(0, 100 * level - totalXP);
  return {
    currentStreak: progress?.currentStreak ?? 0,
    longestStreak: progress?.longestStreak ?? progress?.currentStreak ?? 0,
    totalXP,
    currentLevel: level,
    xpToNextLevel,
    workoutsCompleted: progress?.workoutsCompleted ?? 0,
    achievements: [],
    lastActivityDate:
      progress?.lastActivityDate?.toISOString().slice(0, 10) ??
      new Date().toISOString().slice(0, 10),
    dailyGoalXP: progress?.dailyGoalXP ?? 100,
    weeklyXP: [0, 0, 0, 0, 0, 0, 0],
    todayXP: progress?.todayXP ?? 0,
  };
}

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

    const assignments = user.student.personalAssignments;
    const assignedGymIds = assignments.map((a) => a.gymId ?? "independent");

    return {
      found: true,
      assignedGymIds,
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
      where: { studentId_personalId_gymId: { studentId, personalId, gymId } },
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

    const existing = await db.studentPersonalAssignment.findFirst({
      where: {
        studentId,
        personalId,
        gymId: gymId ?? null,
      },
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

  static async removeAssignment(input: {
    studentId: string;
    personalId: string;
    gymId?: string;
  }) {
    const { studentId, personalId, gymId = null } = input;

    const existing = await db.studentPersonalAssignment.findFirst({
      where: { studentId, personalId, gymId },
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

  static async listStudentsByPersonal(
    personalId: string,
    gymId?: string | null,
    options?: { fresh?: boolean },
  ) {
    const cacheKey = buildPersonalStudentCacheKey(personalId, "assignments", {
      gymId: gymId ?? "all",
    });

    if (!options?.fresh) {
      const cached =
        await getCachedJson<PersonalStudentListAssignment[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const assignments = await db.studentPersonalAssignment.findMany({
      where: {
        personalId,
        status: "active",
        ...(gymId !== undefined ? { gymId } : {}),
      },
      include: personalStudentListInclude,
      orderBy: { createdAt: "desc" },
    });

    await setCachedJson(
      cacheKey,
      assignments,
      PERSONAL_STUDENTS_CACHE_TTL_SECONDS,
    );

    return assignments;
  }

  /**
   * Lista alunos do personal no formato StudentData[] para uso com GymStudentsPage.
   */
  static async listStudentsAsStudentData(
    personalId: string,
    gymId?: string,
    options?: { fresh?: boolean },
  ): Promise<StudentData[]> {
    const cacheKey = buildPersonalStudentCacheKey(personalId, "student-data", {
      gymId: gymId ?? "all",
    });

    if (!options?.fresh) {
      const cached = await getCachedJson<StudentData[]>(cacheKey);
      if (cached) {
        return cached as StudentData[];
      }
    }

    const assignments = await StudentPersonalService.listStudentsByPersonal(
      personalId,
      gymId,
      {
        fresh: options?.fresh,
      },
    );
    const result: StudentData[] = [];

    for (const a of assignments) {
      const { student } = a;
      const profile = student.profile;
      const progress = student.progress;
      const goals: string[] = parseJsonSafe<string[]>(profile?.goals, []) ?? [];
      const workoutsCompleted = progress?.workoutsCompleted ?? 0;
      const weeklyFreq = profile?.weeklyWorkoutFrequency ?? 3;
      const expectedMonthly = weeklyFreq * 4;
      const attendanceRate =
        expectedMonthly > 0
          ? Math.min(
              100,
              Math.round((workoutsCompleted / expectedMonthly) * 100),
            )
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
              gender:
                (student.gender as
                  | "male"
                  | "female"
                  | "non-binary"
                  | "prefer-not-to-say") ?? "prefer-not-to-say",
              height: profile.height ?? 0,
              weight: profile.weight ?? 0,
              fitnessLevel:
                (profile.fitnessLevel as
                  | "iniciante"
                  | "intermediario"
                  | "avancado") ?? "iniciante",
              weeklyWorkoutFrequency: profile.weeklyWorkoutFrequency ?? 3,
              workoutDuration: profile.workoutDuration ?? 60,
              goals: goals as (
                | "perder-peso"
                | "ganhar-massa"
                | "definir"
                | "saude"
                | "forca"
                | "resistencia"
              )[],
              injuries: parseJsonSafe<string[]>(profile.injuries, []) ?? [],
              availableEquipment:
                parseJsonSafe<string[]>(
                profile.availableEquipment,
                [],
                ) ?? [],
              gymType:
                (profile.gymType as
                  | "academia-completa"
                  | "academia-basica"
                  | "home-gym"
                  | "peso-corporal") ?? "academia-completa",
              preferredWorkoutTime:
                (profile.preferredWorkoutTime as "manha" | "tarde" | "noite") ??
                "manha",
              preferredSets: profile.preferredSets ?? 3,
              preferredRepRange:
                (profile.preferredRepRange as
                  | "forca"
                  | "hipertrofia"
                  | "resistencia") ?? "hipertrofia",
              restTime:
                (profile.restTime as "curto" | "medio" | "longo") ?? "medio",
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
        favoriteEquipment:
          parseJsonSafe<string[]>(profile?.availableEquipment, []) ?? [],
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

    await setCachedJson(cacheKey, result, PERSONAL_STUDENTS_CACHE_TTL_SECONDS);

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
    const goals: UserProfile["goals"] = profile?.goals
      ? toGoals(parseJsonSafe<unknown[]>(profile.goals, []))
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

    const personalsAssignments =
      await StudentPersonalService.listPersonalsByStudent(student.id);
    const assignedPersonals = personalsAssignments.map((a) => ({
      id: a.personal.id,
      name: a.personal.name,
      email: a.personal.email ?? undefined,
      gym: a.gym ? { id: a.gym.id, name: a.gym.name } : undefined,
    }));

    const workoutHistory = (student.workouts ?? []).map((wh) => {
      const setsParsed = (ex: { sets: string }) =>
        parseJsonArray<{ weight?: number; reps?: number }>(ex.sets).map(
          (set, i) => ({
            setNumber: i + 1,
            weight: set.weight ?? 0,
            reps: set.reps ?? 0,
            completed: true,
          }),
        );
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
          difficulty: toExerciseDifficulty(ex.difficulty),
        })) as ExerciseLog[],
        overallFeedback: toOverallFeedback(wh.overallFeedback ?? undefined),
        bodyPartsFatigued: wh.bodyPartsFatigued
          ? toMuscleGroups(
              parseJsonSafe<unknown[]>(wh.bodyPartsFatigued, []),
            )
          : [],
      };
    }) as WorkoutHistory[];

    const studentData: StudentData = {
      id: student.id,
      name: student.user?.name ?? "",
      email: student.user?.email ?? "",
      avatar: student.avatar ?? undefined,
      age: student.age ?? 0,
      gender: student.gender ?? "",
      phone: student.phone ?? "",
      membershipStatus: assignment.status === "active" ? "active" : "inactive",
      joinDate: assignment.createdAt,
      totalVisits,
      currentStreak: progress?.currentStreak ?? 0,
      profile: buildUserProfile(student, profile, goals),
      progress: buildUserProgress(progress),
      workoutHistory,
      weightHistory: weightHistoryList.map((wh) => ({
        date: wh.date,
        weight: wh.weight,
      })),
      weightGain,
      hasWeightLossGoal: goals.includes("perder-peso"),
      attendanceRate,
      favoriteEquipment: profile?.availableEquipment
        ? (parseJsonSafe<unknown[]>(profile.availableEquipment, []) ?? []).filter(
            (x): x is string => typeof x === "string",
          )
        : [],
      currentWeight,
      personalRecords: (student.records ?? []).map((r) => ({
        exerciseId: r.exerciseId ?? "",
        exerciseName: r.exerciseName ?? "",
        date: r.date,
        value: r.value ?? 0,
        type:
          (r.type as "max-weight" | "max-reps" | "max-volume") ?? "max-weight",
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
      assignedPersonals,
    };

    return studentData;
  }
}
