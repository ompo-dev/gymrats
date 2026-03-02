import { db } from "@/lib/db";

export interface GetStudentProgressInput {
  studentId: string;
}

export interface GetStudentProgressOutput {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  workoutsCompleted: number;
  todayXP: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    progress?: number | null;
    target?: number | null;
    category: "streak" | "workouts" | "xp" | "perfect" | "special";
    level?: number | null;
    color: string;
  }>;
  lastActivityDate: string;
  dailyGoalXP: number;
  weeklyXP: number[];
}

export async function getStudentProgressUseCase(
  input: GetStudentProgressInput,
): Promise<GetStudentProgressOutput> {
  const { studentId } = input;

  const progress = await db.studentProgress.findUnique({
    where: { studentId },
  });

  if (!progress) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      currentLevel: 1,
      xpToNextLevel: 100,
      workoutsCompleted: 0,
      todayXP: 0,
      achievements: [],
      lastActivityDate: new Date().toISOString(),
      dailyGoalXP: 50,
      weeklyXP: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  const achievementUnlocks = await db.achievementUnlock.findMany({
    where: { studentId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });

  const achievements = achievementUnlocks.map((unlock) => ({
    id: unlock.achievement.id,
    title: unlock.achievement.title,
    description: unlock.achievement.description || "",
    icon: unlock.achievement.icon || "🏆",
    unlockedAt: unlock.unlockedAt,
    progress: unlock.progress || undefined,
    target: unlock.achievement.target || undefined,
    category: unlock.achievement.category as
      | "streak"
      | "workouts"
      | "xp"
      | "perfect"
      | "special",
    level: unlock.achievement.level || undefined,
    color: unlock.achievement.color || "#58CC02",
  }));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const workoutHistoryForXP = await db.workoutHistory.findMany({
    where: {
      studentId,
      date: { gte: sevenDaysAgo },
    },
    include: {
      workout: { select: { xpReward: true } },
    },
  });

  const weeklyXP = [0, 0, 0, 0, 0, 0, 0];
  workoutHistoryForXP.forEach((wh) => {
    const dayOfWeek = wh.date.getDay();
    weeklyXP[dayOfWeek] += wh.workout?.xpReward ?? 0;
  });

  const allWorkoutHistory = await db.workoutHistory.findMany({
    where: { studentId },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const workoutDays = new Set<string>();
  allWorkoutHistory.forEach((wh) => {
    const dateOnly = new Date(wh.date);
    dateOnly.setHours(0, 0, 0, 0);
    workoutDays.add(dateOnly.toISOString().split("T")[0]);
  });

  let calculatedStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (workoutDays.has(dateStr)) {
      calculatedStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  if (calculatedStreak !== (progress.currentStreak || 0)) {
    const longestStreak = Math.max(
      calculatedStreak,
      progress.longestStreak || 0,
    );

    await db.studentProgress.update({
      where: { studentId },
      data: {
        currentStreak: calculatedStreak,
        longestStreak,
      },
    });
  }

  return {
    currentStreak: calculatedStreak,
    longestStreak: Math.max(calculatedStreak, progress.longestStreak || 0),
    totalXP: progress.totalXP || 0,
    currentLevel: progress.currentLevel || 1,
    xpToNextLevel: progress.xpToNextLevel || 100,
    workoutsCompleted: progress.workoutsCompleted || 0,
    todayXP: progress.todayXP || 0,
    achievements,
    lastActivityDate: progress.lastActivityDate
      ? progress.lastActivityDate.toISOString()
      : new Date().toISOString(),
    dailyGoalXP: progress.dailyGoalXP || 50,
    weeklyXP,
  };
}
