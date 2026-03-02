/**
 * Use Case: Get Workout History
 * Busca histórico de workouts completados com paginação.
 */

import { db } from "@/lib/db";

export interface GetWorkoutHistoryInput {
  studentId: string;
  limit?: number;
  offset?: number;
}

export interface WorkoutHistoryItemDTO {
  date: Date;
  workoutId: string | null;
  workoutName: string;
  duration: number;
  totalVolume: number;
  exercises: Array<{
    id: string;
    exerciseId: string;
    exerciseName: string;
    workoutId: string | null;
    date: Date;
    sets: Array<{ weight?: number; reps?: number; completed?: boolean }>;
    notes?: string;
    formCheckScore?: number;
    difficulty?: string;
  }>;
  overallFeedback?: "excelente" | "bom" | "regular" | "ruim";
  bodyPartsFatigued: string[];
}

export interface GetWorkoutHistoryOutput {
  history: WorkoutHistoryItemDTO[];
  total: number;
  limit: number;
  offset: number;
}

export async function getWorkoutHistoryUseCase(
  input: GetWorkoutHistoryInput,
): Promise<GetWorkoutHistoryOutput> {
  const { studentId, limit = 10, offset = 0 } = input;

  const [workoutHistory, total] = await Promise.all([
    db.workoutHistory.findMany({
      where: { studentId },
      include: {
        workout: {
          select: { id: true, title: true, type: true, muscleGroup: true },
        },
        exercises: { orderBy: { id: "asc" } },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    db.workoutHistory.count({ where: { studentId } }),
  ]);

  const history: WorkoutHistoryItemDTO[] = workoutHistory.map((wh) => {
    let calculatedVolume = 0;
    if (wh.exercises?.length > 0) {
      calculatedVolume = wh.exercises.reduce((acc, el) => {
        try {
          const sets = JSON.parse(el.sets);
          if (Array.isArray(sets)) {
            return (
              acc +
              sets.reduce(
                (
                  setAcc: number,
                  set: { weight?: number; reps?: number; completed?: boolean },
                ) => {
                  if (set.weight && set.reps && (set.completed ?? true)) {
                    return setAcc + set.weight * set.reps;
                  }
                  return setAcc;
                },
                0,
              )
            );
          }
        } catch {
          // ignorar
        }
        return acc;
      }, 0);
    }

    let bodyPartsFatigued: string[] = [];
    if (wh.bodyPartsFatigued) {
      try {
        bodyPartsFatigued = JSON.parse(wh.bodyPartsFatigued);
      } catch {
        // ignorar
      }
    }

    return {
      date: wh.date,
      workoutId: wh.workoutId,
      workoutName: wh.workout?.title ?? "",
      duration: wh.duration,
      totalVolume: wh.totalVolume ?? calculatedVolume,
      exercises: wh.exercises.map((el) => {
        let sets: Array<{
          weight?: number;
          reps?: number;
          completed?: boolean;
        }> = [];
        try {
          sets = JSON.parse(el.sets);
        } catch {
          // ignorar
        }
        return {
          id: el.id,
          exerciseId: el.exerciseId,
          exerciseName: el.exerciseName,
          workoutId: wh.workoutId,
          date: wh.date,
          sets,
          notes: el.notes ?? undefined,
          formCheckScore: el.formCheckScore ?? undefined,
          difficulty: el.difficulty ?? undefined,
        };
      }),
      overallFeedback:
        (wh.overallFeedback as "excelente" | "bom" | "regular" | "ruim") ??
        undefined,
      bodyPartsFatigued,
    };
  });

  return { history, total, limit, offset };
}
