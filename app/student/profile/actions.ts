"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { db } from "@/lib/db";
import type { UserProgress, MuscleGroup } from "@/lib/types";
import {
  mockUserProgress,
  mockWorkoutHistory,
  mockPersonalRecords,
  mockWeightHistory,
} from "@/lib/mock-data";

export async function getStudentProfileData() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return {
        progress: mockUserProgress,
        workoutHistory: mockWorkoutHistory.slice(0, 3),
        personalRecords: mockPersonalRecords,
        weightHistory: mockWeightHistory,
        userInfo: null,
        weeklyWorkouts: 0,
        weightGain: null,
        ranking: null,
        hasWeightLossGoal: false,
      };
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return {
        progress: mockUserProgress,
        workoutHistory: mockWorkoutHistory.slice(0, 3),
        personalRecords: mockPersonalRecords,
        weightHistory: mockWeightHistory,
        userInfo: null,
        weeklyWorkouts: 0,
        weightGain: null,
        ranking: null,
        hasWeightLossGoal: false,
      };
    }

    const studentId = session.user.student.id;
    const userId = session.userId;

    // Buscar dados do usuário
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Buscar perfil do aluno
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        profile: true,
      },
    });

    // Buscar objetivos do aluno para determinar se perda de peso é positiva
    let hasWeightLossGoal = false;
    if (student?.profile?.goals) {
      try {
        const goals = JSON.parse(student.profile.goals);
        hasWeightLossGoal = Array.isArray(goals) && goals.includes("perder-peso");
      } catch (e) {
        // Ignorar erro de parse
      }
    }

    const progress = await db.studentProgress.findUnique({
      where: { studentId: studentId },
    });

    const userProgress: UserProgress = progress
      ? {
          currentStreak: progress.currentStreak || 0,
          longestStreak: progress.longestStreak || 0,
          totalXP: progress.totalXP || 0,
          currentLevel: progress.currentLevel || 1,
          xpToNextLevel: progress.xpToNextLevel || 0,
          workoutsCompleted: progress.workoutsCompleted || 0,
          todayXP: progress.todayXP || 0,
          achievements: [],
          lastActivityDate: new Date().toISOString(),
          dailyGoalXP: 50,
          weeklyXP: [0, 0, 0, 0, 0, 0, 0],
        }
      : mockUserProgress;

    // Buscar histórico de workouts do database
    const workoutHistoryData = await db.workoutHistory.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
          },
        },
        exercises: {
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    // Transformar workout history
    const formattedWorkoutHistory = workoutHistoryData.map((wh) => {
      // Calcular volume total
      let calculatedVolume = 0;
      if (wh.exercises && wh.exercises.length > 0) {
        calculatedVolume = wh.exercises.reduce((acc, el) => {
          try {
            const sets = JSON.parse(el.sets);
            if (Array.isArray(sets)) {
              return (
                acc +
                sets.reduce((setAcc: number, set: any) => {
                  if (set.weight && set.reps && set.completed) {
                    return setAcc + set.weight * set.reps;
                  }
                  return setAcc;
                }, 0)
              );
            }
          } catch (e) {
            // Ignorar erro de parse
          }
          return acc;
        }, 0);
      }

      // Parse bodyPartsFatigued
      let bodyPartsFatigued: MuscleGroup[] = [];
      if (wh.bodyPartsFatigued) {
        try {
          const parsed = JSON.parse(wh.bodyPartsFatigued);
          if (Array.isArray(parsed)) {
            bodyPartsFatigued = parsed.filter((item): item is MuscleGroup => 
              typeof item === "string" && 
              ["peito", "costas", "pernas", "ombros", "bracos", "core", "gluteos", "cardio", "funcional"].includes(item)
            );
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      }

      return {
        date: wh.date,
        workoutId: wh.workoutId,
        workoutName: wh.workout.title,
        duration: wh.duration,
        totalVolume: wh.totalVolume || calculatedVolume,
        exercises: wh.exercises.map((el) => {
          let sets: any[] = [];
          try {
            sets = JSON.parse(el.sets);
          } catch (e) {
            // Ignorar erro de parse
          }

          return {
            id: el.id,
            exerciseId: el.exerciseId,
            exerciseName: el.exerciseName,
            workoutId: wh.workoutId,
            date: wh.date,
            sets: sets,
            notes: el.notes || undefined,
            formCheckScore: el.formCheckScore || undefined,
            difficulty: (el.difficulty && ["muito-facil", "facil", "ideal", "dificil", "muito-dificil"].includes(el.difficulty))
              ? (el.difficulty as "muito-facil" | "facil" | "ideal" | "dificil" | "muito-dificil")
              : "ideal",
          };
        }),
        overallFeedback:
          (wh.overallFeedback as
            | "excelente"
            | "bom"
            | "regular"
            | "ruim") || undefined,
        bodyPartsFatigued: bodyPartsFatigued,
      };
    });

    // Buscar recordes pessoais do database
    const personalRecordsData = await db.personalRecord.findMany({
      where: {
        studentId: studentId,
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    const formattedPersonalRecords = personalRecordsData.map((pr) => ({
      exerciseId: pr.exerciseId,
      exerciseName: pr.exerciseName,
      type: pr.type as "max-weight" | "max-reps" | "max-volume",
      value: pr.value,
      date: pr.date,
      previousBest: pr.previousBest || undefined,
    }));

    // Buscar histórico de peso do database
    // Se a tabela não existir (migration não aplicada), usar mock
    let formattedWeightHistory = mockWeightHistory;
    try {
      const weightHistoryData = await db.weightHistory.findMany({
        where: {
          studentId: studentId,
        },
        orderBy: {
          date: "desc",
        },
        take: 30, // Últimos 30 registros
      });

      formattedWeightHistory = weightHistoryData.map((wh) => ({
        date: wh.date,
        weight: wh.weight,
      }));
    } catch (error: any) {
      // Se a tabela não existir, usar mock
      if (
        error.code === "P2021" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("Unknown table")
      ) {
        console.log(
          "Tabela weight_history não existe ainda. Usando mock. Execute: node scripts/apply-weight-history-migration.js"
        );
        formattedWeightHistory = mockWeightHistory;
      } else {
        // Outro erro, logar e usar mock
        console.error("Erro ao buscar weight history:", error);
        formattedWeightHistory = mockWeightHistory;
      }
    }

    // Calcular workouts da semana (últimos 7 dias)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyWorkouts = await db.workoutHistory.count({
      where: {
        studentId: studentId,
        date: {
          gte: oneWeekAgo,
        },
      },
    });

    // Calcular ganho/perda de peso (último mês)
    let weightGain: number | null = null;
    if (formattedWeightHistory.length > 0) {
      const currentWeight = formattedWeightHistory[0].weight;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      // Buscar peso de 1 mês atrás
      try {
        const weightOneMonthAgo = await db.weightHistory.findFirst({
          where: {
            studentId: studentId,
            date: {
              lte: oneMonthAgo,
            },
          },
          orderBy: {
            date: "desc",
          },
        });

        if (weightOneMonthAgo) {
          weightGain = currentWeight - weightOneMonthAgo.weight;
        }
      } catch (error) {
        // Ignorar erro
      }
    }

    // Calcular ranking (percentil baseado em totalXP)
    // Ranking = quantos alunos têm MAIS XP que você
    let ranking: number | null = null;
    try {
      const studentsWithMoreXP = await db.studentProgress.count({
        where: {
          totalXP: {
            gt: userProgress.totalXP,
          },
        },
      });

      const totalStudentsWithProgress = await db.studentProgress.count();
      
      if (totalStudentsWithProgress > 0) {
        // Percentil = (alunos com mais XP / total) * 100
        // Se você está no top 15%, significa que 15% dos alunos têm mais XP
        ranking = Math.round((studentsWithMoreXP / totalStudentsWithProgress) * 100);
      }
    } catch (error) {
      // Ignorar erro
    }

    // Gerar username do email
    const username = user?.email
      ? `@${user.email.split("@")[0].toLowerCase()}`
      : "@usuario";

    // Formatar memberSince
    const memberSince = user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        })
      : "Jan 2025";

    // Peso atual (último registro de WeightHistory ou do perfil)
    const currentWeight = formattedWeightHistory.length > 0 
      ? formattedWeightHistory[0].weight 
      : (student?.profile?.weight || null);

    return {
      progress: userProgress,
      workoutHistory: formattedWorkoutHistory.slice(0, 3) as any,
      personalRecords: formattedPersonalRecords,
      weightHistory: formattedWeightHistory,
      userInfo: {
        name: user?.name || "Usuário",
        username: username,
        memberSince: memberSince,
      },
      currentWeight: currentWeight,
      weightGain: weightGain,
      weeklyWorkouts: weeklyWorkouts,
      ranking: ranking,
      hasWeightLossGoal: hasWeightLossGoal,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
    return {
      progress: mockUserProgress,
      workoutHistory: mockWorkoutHistory.slice(0, 3),
      personalRecords: mockPersonalRecords,
      weightHistory: mockWeightHistory,
      userInfo: null,
      weeklyWorkouts: 0,
      weightGain: null,
      ranking: null,
      currentWeight: null,
      hasWeightLossGoal: false,
    };
  }
}
