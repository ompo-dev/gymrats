/**
 * Caso de uso: buscar units com workouts e exercícios formatados
 */

import { db } from "@/lib/db";

export interface GetUnitsInput {
  studentId: string;
}

export async function getUnitsUseCase(input: GetUnitsInput) {
  const { studentId } = input;

  let units = await db.unit.findMany({
    where: { studentId },
    orderBy: { order: "asc" },
    include: {
      workouts: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: {
              alternatives: { orderBy: { order: "asc" } },
            },
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

  if (units.length === 0) {
    units = await db.unit.findMany({
      where: { studentId: null },
      orderBy: { order: "asc" },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
              include: {
                alternatives: { orderBy: { order: "asc" } },
              },
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
  }

  const completedWorkoutIds = await db.workoutHistory.findMany({
    where: { studentId },
    select: { workoutId: true },
    distinct: ["workoutId"],
  });
  const completedIdsSet = new Set(
    completedWorkoutIds.map((wh) => wh.workoutId),
  );

  const formattedUnits = units.map((unit) => ({
    id: unit.id,
    title: unit.title,
    description: unit.description || "",
    color: unit.color || "#58CC02",
    icon: unit.icon || "💪",
    workouts: unit.workouts.map((workout) => {
      const isCompleted = completedIdsSet.has(workout.id);
      const lastCompletion = workout.completions[0];

      let isLocked = workout.locked;
      const workoutIndex = unit.workouts.findIndex((w) => w.id === workout.id);
      const unitIndex = units.findIndex((u) => u.id === unit.id);

      if (unitIndex === 0 && workoutIndex === 0) {
        isLocked = false;
      } else if (!isLocked && (unitIndex > 0 || workoutIndex > 0)) {
        let previousWorkout = null;
        if (workoutIndex > 0) {
          previousWorkout = unit.workouts[workoutIndex - 1];
        } else if (unitIndex > 0) {
          const previousUnit = units[unitIndex - 1];
          if (previousUnit.workouts.length > 0) {
            previousWorkout =
              previousUnit.workouts[previousUnit.workouts.length - 1];
          }
        }
        if (previousWorkout) {
          isLocked = !completedIdsSet.has(previousWorkout.id);
        }
      }

      let stars: number | undefined;
      if (lastCompletion) {
        stars =
          lastCompletion.overallFeedback === "excelente"
            ? 3
            : lastCompletion.overallFeedback === "bom"
              ? 2
              : lastCompletion.overallFeedback === "regular"
                ? 1
                : 0;
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
          primaryMuscles: exercise.primaryMuscles
            ? JSON.parse(exercise.primaryMuscles)
            : undefined,
          secondaryMuscles: exercise.secondaryMuscles
            ? JSON.parse(exercise.secondaryMuscles)
            : undefined,
          difficulty: exercise.difficulty || undefined,
          equipment: exercise.equipment
            ? JSON.parse(exercise.equipment)
            : undefined,
          instructions: exercise.instructions
            ? JSON.parse(exercise.instructions)
            : undefined,
          tips: exercise.tips ? JSON.parse(exercise.tips) : undefined,
          commonMistakes: exercise.commonMistakes
            ? JSON.parse(exercise.commonMistakes)
            : undefined,
          benefits: exercise.benefits
            ? JSON.parse(exercise.benefits)
            : undefined,
          scientificEvidence: exercise.scientificEvidence || undefined,
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
        stars,
        completedAt: lastCompletion?.date || undefined,
      };
    }),
  }));

  return { units: formattedUnits };
}
