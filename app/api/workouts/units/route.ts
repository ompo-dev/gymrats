import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session || !session.user.student) {
      return NextResponse.json(
        { error: "Sessão inválida ou usuário não é aluno" },
        { status: 401 }
      );
    }

    const studentId = session.user.student.id;

    // Buscar units com workouts e exercícios
    const units = await db.unit.findMany({
      orderBy: { order: "asc" },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
              include: {
                alternatives: {
                  orderBy: { order: "asc" },
                },
              },
            },
            completions: {
              where: {
                studentId: studentId,
              },
              orderBy: {
                date: "desc",
              },
              take: 1, // Pegar apenas a última completion
            },
          },
        },
      },
    });

    // Buscar histórico de workouts completados para calcular locked e completed
    const completedWorkoutIds = await db.workoutHistory.findMany({
      where: {
        studentId: studentId,
      },
      select: {
        workoutId: true,
      },
      distinct: ["workoutId"],
    });

    const completedIdsSet = new Set(
      completedWorkoutIds.map((wh) => wh.workoutId)
    );

    // Transformar dados para o formato esperado pelo frontend
    const formattedUnits = units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description || "",
      color: unit.color || "#58CC02",
      icon: unit.icon || "💪",
      workouts: unit.workouts.map((workout) => {
        const isCompleted = completedIdsSet.has(workout.id);
        const lastCompletion = workout.completions[0];

        // Calcular locked
        // Um workout está locked se:
        // 1. Está marcado como locked no DB, OU
        // 2. Não é o primeiro workout da primeira unit E não completou o anterior
        let isLocked = workout.locked;

        // Encontrar índice do workout na unit
        const workoutIndex = unit.workouts.findIndex(
          (w) => w.id === workout.id
        );

        // Encontrar índice da unit no array
        const unitIndex = units.findIndex((u) => u.id === unit.id);

        // Se é o primeiro workout da primeira unit, NUNCA deve estar locked
        if (unitIndex === 0 && workoutIndex === 0) {
          isLocked = false;
        } else if (!isLocked) {
          // Se não é o primeiro workout da primeira unit
          if (unitIndex > 0 || workoutIndex > 0) {
            let previousWorkout = null;

            if (workoutIndex > 0) {
              // Workout anterior na mesma unit
              previousWorkout = unit.workouts[workoutIndex - 1];
            } else if (unitIndex > 0) {
              // Último workout da unit anterior
              const previousUnit = units[unitIndex - 1];
              if (previousUnit.workouts.length > 0) {
                previousWorkout =
                  previousUnit.workouts[previousUnit.workouts.length - 1];
              }
            }

            // Se tem workout anterior, verificar se foi completado
            if (previousWorkout) {
              isLocked = !completedIdsSet.has(previousWorkout.id);
            }
          }
        }

        // Calcular stars baseado na última completion (0-3)
        let stars: number | undefined = undefined;
        if (lastCompletion) {
          // Lógica simples: baseado em overallFeedback
          if (lastCompletion.overallFeedback === "excelente") {
            stars = 3;
          } else if (lastCompletion.overallFeedback === "bom") {
            stars = 2;
          } else if (lastCompletion.overallFeedback === "regular") {
            stars = 1;
          } else {
            stars = 0;
          }
        }

        return {
          id: workout.id,
          title: workout.title,
          description: workout.description || "",
          type: workout.type as "strength" | "cardio" | "flexibility" | "rest",
          muscleGroup: workout.muscleGroup,
          difficulty: workout.difficulty as
            | "iniciante"
            | "intermediario"
            | "avancado",
          exercises: workout.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            rest: exercise.rest,
            notes: exercise.notes || undefined,
            videoUrl: exercise.videoUrl || undefined,
            educationalId: exercise.educationalId || undefined,
            alternatives:
              exercise.alternatives.length > 0
                ? exercise.alternatives.map((alt) => ({
                    id: alt.id,
                    name: alt.name,
                    reason: alt.reason,
                    educationalId: alt.educationalId || undefined,
                  }))
                : undefined,
          })),
          xpReward: workout.xpReward,
          estimatedTime: workout.estimatedTime,
          locked: isLocked,
          completed: isCompleted,
          stars: stars,
          completedAt: lastCompletion?.date || undefined,
        };
      }),
    }));

    return NextResponse.json({ units: formattedUnits });
  } catch (error: any) {
    console.error("Erro ao buscar units:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar treinos" },
      { status: 500 }
    );
  }
}

