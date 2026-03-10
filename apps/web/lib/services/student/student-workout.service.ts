import { db } from "@/lib/db";

export class StudentWorkoutService {
  /**
   * Busca o histórico de treinos do aluno
   */
  static async getWorkoutHistory(studentId: string, limit = 10) {
    const history = await db.workoutHistory.findMany({
      where: { studentId },
      include: {
        workout: { select: { id: true, title: true } },
        exercises: { orderBy: { id: "asc" } },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return history.map((wh) => {
      let calculatedVolume = 0;
      if (wh.exercises && wh.exercises.length > 0) {
        calculatedVolume = wh.exercises.reduce((acc, el) => {
          try {
            const sets = JSON.parse(el.sets);
            if (Array.isArray(sets)) {
              return (
                acc +
                sets.reduce(
                  (
                    setAcc: number,
                    set: {
                      weight?: number;
                      reps?: number;
                      completed?: boolean;
                    },
                  ) => {
                    if (set.weight && set.reps && set.completed) {
                      return setAcc + set.weight * set.reps;
                    }
                    return setAcc;
                  },
                  0,
                )
              );
            }
          } catch (_e) {}
          return acc;
        }, 0);
      }

      return {
        id: wh.id,
        date: wh.date,
        workoutId: wh.workoutId,
        workoutName: wh.workout?.title ?? "Treino",
        duration: wh.duration,
        totalVolume: wh.totalVolume || calculatedVolume,
        exercises: wh.exercises.map((el) => ({
          id: el.id,
          exerciseId: el.exerciseId,
          exerciseName: el.exerciseName,
          sets: JSON.parse(el.sets),
          notes: el.notes || undefined,
        })),
      };
    });
  }

  /**
   * Busca os recordes pessoais do aluno
   */
  static async getPersonalRecords(studentId: string) {
    return db.personalRecord.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 10,
    });
  }

  /**
   * Busca unidades e treinos para o mapa de progresso
   */
  static async getUnitsWithWorkouts(studentId: string) {
    const units = await db.unit.findMany({
      orderBy: { order: "asc" },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
              include: { alternatives: true },
            },
            completions: {
              where: { studentId },
              orderBy: { date: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const completedWorkoutIds = await db.workoutHistory.findMany({
      where: { studentId },
      select: { workoutId: true },
      distinct: ["workoutId"],
    });
    const completedIdsSet = new Set(
      completedWorkoutIds.map((wh) => wh.workoutId),
    );

    return units.map((unit, _unitIndex) => ({
      id: unit.id,
      title: unit.title,
      description: unit.description || "",
      color: unit.color || "#58CC02",
      icon: unit.icon || "💪",
      workouts: unit.workouts.map((workout, workoutIndex) => {
        const isCompleted = completedIdsSet.has(workout.id);
        const lastCompletion = workout.completions[0];

        // Lógica de trancamento simplificada para o serviço
        const isLocked =
          workoutIndex > 0 &&
          !completedIdsSet.has(unit.workouts[workoutIndex - 1].id);

        let stars = 0;
        if (lastCompletion) {
          if (lastCompletion.overallFeedback === "excelente") stars = 3;
          else if (lastCompletion.overallFeedback === "bom") stars = 2;
          else if (lastCompletion.overallFeedback === "regular") stars = 1;
        }

        return {
          id: workout.id,
          title: workout.title,
          description: workout.description || "",
          type: workout.type,
          muscleGroup: workout.muscleGroup,
          difficulty: workout.difficulty,
          xpReward: workout.xpReward,
          estimatedTime: workout.estimatedTime,
          locked: isLocked,
          completed: isCompleted,
          stars,
          completedAt: lastCompletion?.date,
          exercises: workout.exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.rest,
            notes: ex.notes,
            videoUrl: ex.videoUrl,
            alternatives: ex.alternatives.map((alt) => ({
              id: alt.id,
              name: alt.name,
              reason: alt.reason,
            })),
          })),
        };
      }),
    }));
  }
}
