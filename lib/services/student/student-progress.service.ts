import { db } from "@/lib/db";

export class StudentProgressService {
  /**
   * Calcula a sequência (streak) atual do aluno
   */
  static async calculateStreak(studentId: string) {
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

    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const todayStr = checkDate.toISOString().split("T")[0];
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (!workoutDays.has(todayStr) && !workoutDays.has(yesterdayStr)) {
      currentStreak = 0;
    } else {
      if (!workoutDays.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (workoutDays.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return currentStreak;
  }

  /**
   * Adiciona XP e lida com a lógica de nível
   */
  static async addXP(studentId: string, amount: number) {
    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    });

    if (!progress) {
      return db.studentProgress.create({
        data: {
          studentId,
          totalXP: amount,
          todayXP: amount,
          currentLevel: 1,
          xpToNextLevel: 100,
        },
      });
    }

    let newTotalXP = (progress.totalXP || 0) + amount;
    let newTodayXP = (progress.todayXP || 0) + amount;
    let newLevel = progress.currentLevel || 1;
    let newXPToNextLevel = progress.xpToNextLevel || 100;

    while (newTotalXP >= newXPToNextLevel) {
      newLevel++;
      newXPToNextLevel += newLevel * 100 + 50;
    }

    return db.studentProgress.update({
      where: { studentId },
      data: {
        totalXP: newTotalXP,
        todayXP: newTodayXP,
        currentLevel: newLevel,
        xpToNextLevel: newXPToNextLevel,
        lastActivityDate: new Date(),
      },
    });
  }

  /**
   * Busca o progresso detalhado do aluno
   */
  static async getProgress(studentId: string) {
    const progress = await db.studentProgress.findUnique({
      where: { studentId },
    });

    const calculatedStreak = await this.calculateStreak(studentId);
    
    // Sincronizar streak no banco se necessário
    if (progress && calculatedStreak !== (progress.currentStreak || 0)) {
        await db.studentProgress.update({
            where: { studentId },
            data: { 
                currentStreak: calculatedStreak,
                longestStreak: Math.max(calculatedStreak, progress.longestStreak || 0)
            },
        });
    }

    // Buscar achievements desbloqueados
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
      category: unlock.achievement.category,
      color: unlock.achievement.color || "#58CC02",
    }));

    // Calcular weeklyXP (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const workoutHistory = await db.workoutHistory.findMany({
      where: { studentId, date: { gte: sevenDaysAgo } },
      include: { workout: { select: { xpReward: true } } },
    });

    const weeklyXP = [0, 0, 0, 0, 0, 0, 0];
    workoutHistory.forEach((wh) => {
      const dayOfWeek = wh.date.getDay();
      weeklyXP[dayOfWeek] += wh.workout?.xpReward ?? 0;
    });

    return {
      currentStreak: calculatedStreak,
      longestStreak: progress ? Math.max(calculatedStreak, progress.longestStreak || 0) : 0,
      totalXP: progress?.totalXP || 0,
      currentLevel: progress?.currentLevel || 1,
      xpToNextLevel: progress?.xpToNextLevel || 100,
      workoutsCompleted: progress?.workoutsCompleted || 0,
      todayXP: progress?.todayXP || 0,
      achievements,
      weeklyXP,
      dailyGoalXP: progress?.dailyGoalXP || 50,
      lastActivityDate: progress?.lastActivityDate?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Calcula o ranking do aluno baseado no XP total
   */
  static async getRanking(studentId: string, totalXP: number) {
    try {
      const studentsWithMoreXP = await db.studentProgress.count({
        where: { totalXP: { gt: totalXP } },
      });

      const totalStudents = await db.studentProgress.count();

      if (totalStudents > 0) {
        return Math.round((studentsWithMoreXP / totalStudents) * 100);
      }
    } catch (e) {}
    return null;
  }
}
