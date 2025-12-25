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

    // Ler query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Buscar histórico de workouts
    const workoutHistory = await db.workoutHistory.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            type: true,
            muscleGroup: true,
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
      take: limit,
      skip: offset,
    });

    // Transformar para formato esperado
    const formattedHistory = workoutHistory.map((wh) => {
      // Calcular volume total dos exercícios
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
      let bodyPartsFatigued: string[] = [];
      if (wh.bodyPartsFatigued) {
        try {
          bodyPartsFatigued = JSON.parse(wh.bodyPartsFatigued);
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
            difficulty: el.difficulty || undefined,
          };
        }),
        overallFeedback:
          (wh.overallFeedback as "excelente" | "bom" | "regular" | "ruim") ||
          undefined,
        bodyPartsFatigued: bodyPartsFatigued,
      };
    });

    // Contar total de registros
    const total = await db.workoutHistory.count({
      where: {
        studentId: studentId,
      },
    });

    return NextResponse.json({
      history: formattedHistory,
      total: total,
      limit: limit,
      offset: offset,
    });
  } catch (error: any) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}

