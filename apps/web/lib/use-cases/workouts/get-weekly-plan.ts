/**
 * Caso de uso: buscar WeeklyPlan com slots formatados
 */

import { db } from "@/lib/db";
import { addDays, getWeekStart } from "@/lib/utils/week";

export interface GetWeeklyPlanInput {
  studentId: string;
  weekOverride?: Date | null;
}

export async function getWeeklyPlanUseCase(input: GetWeeklyPlanInput) {
  const { studentId, weekOverride } = input;

  const weekStart = getWeekStart(weekOverride ?? null);
  const weekEnd = addDays(weekStart, 7);

  const studentData = await db.student.findUnique({
    where: { id: studentId },
    select: { activeWeeklyPlanId: true },
  });

  if (!studentData?.activeWeeklyPlanId) {
    return { weeklyPlan: null, weekStart };
  }

  const weeklyPlan = await db.weeklyPlan.findUnique({
    where: { id: studentData.activeWeeklyPlanId },
    include: {
      slots: {
        orderBy: { dayOfWeek: "asc" },
        include: {
          workout: {
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
      },
    },
  });

  if (!weeklyPlan) {
    return { weeklyPlan: null, weekStart };
  }

  const completionsThisWeek = await db.workoutHistory.findMany({
    where: {
      studentId,
      date: { gte: weekStart, lt: weekEnd },
      workoutId: { not: null },
    },
    select: { workoutId: true, overallFeedback: true, date: true },
  });

  const completedByWorkoutId = new Map(
    completionsThisWeek.map((c) => [
      c.workoutId!,
      { feedback: c.overallFeedback, date: c.date },
    ]),
  );

  const formattedSlots = weeklyPlan.slots.map((slot, index) => {
    const isRest = slot.type === "rest";
    const completed = isRest
      ? true
      : slot.workoutId
        ? completedByWorkoutId.has(slot.workoutId)
        : false;

    const prevSlot = index > 0 ? weeklyPlan.slots[index - 1] : null;
    const prevCompleted =
      !prevSlot || prevSlot.type === "rest"
        ? true
        : prevSlot.workoutId
          ? completedByWorkoutId.has(prevSlot.workoutId)
          : false;

    const locked = isRest ? false : !prevCompleted;

    const completion = slot.workoutId
      ? completedByWorkoutId.get(slot.workoutId)
      : null;
    let stars: number | undefined;
    if (completion?.feedback) {
      stars =
        completion.feedback === "excelente"
          ? 3
          : completion.feedback === "bom"
            ? 2
            : completion.feedback === "regular"
              ? 1
              : 0;
    }

    if (isRest) {
      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        type: "rest" as const,
        locked: false,
        completed: true,
      };
    }

    const workout = slot.workout;
    if (!workout) {
      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        type: "rest" as const,
        locked: false,
        completed: true,
      };
    }

    return {
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      type: "workout" as const,
      workout: {
        id: workout.id,
        title: workout.title,
        description: workout.description || "",
        type: workout.type as "strength" | "cardio" | "flexibility" | "rest",
        muscleGroup: workout.muscleGroup,
        difficulty: workout.difficulty as
          | "iniciante"
          | "intermediario"
          | "avancado",
        exercises: workout.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes || undefined,
          videoUrl: ex.videoUrl || undefined,
          educationalId: ex.educationalId || undefined,
          primaryMuscles: ex.primaryMuscles
            ? JSON.parse(ex.primaryMuscles)
            : undefined,
          secondaryMuscles: ex.secondaryMuscles
            ? JSON.parse(ex.secondaryMuscles)
            : undefined,
          difficulty: ex.difficulty || undefined,
          equipment: ex.equipment ? JSON.parse(ex.equipment) : undefined,
          instructions: ex.instructions
            ? JSON.parse(ex.instructions)
            : undefined,
          tips: ex.tips ? JSON.parse(ex.tips) : undefined,
          commonMistakes: ex.commonMistakes
            ? JSON.parse(ex.commonMistakes)
            : undefined,
          benefits: ex.benefits ? JSON.parse(ex.benefits) : undefined,
          scientificEvidence: ex.scientificEvidence || undefined,
          alternatives:
            ex.alternatives.length > 0
              ? ex.alternatives.map((alt) => ({
                  id: alt.id,
                  name: alt.name,
                  reason: alt.reason,
                  educationalId: alt.educationalId || undefined,
                }))
              : undefined,
        })),
        xpReward: workout.xpReward,
        estimatedTime: workout.estimatedTime,
        locked,
        completed,
        stars,
        completedAt: completion?.date || undefined,
      },
      locked,
      completed,
      stars,
      completedAt: completion?.date || undefined,
    };
  });

  return {
    weeklyPlan: {
      id: weeklyPlan.id,
      title: weeklyPlan.title,
      description: weeklyPlan.description ?? null,
      slots: formattedSlots,
      sourceLibraryPlanId:
        (weeklyPlan as { sourceLibraryPlanId?: string | null })
          .sourceLibraryPlanId ?? null,
    },
    weekStart,
  };
}
