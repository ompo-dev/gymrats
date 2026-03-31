/**
 * Caso de uso: buscar WeeklyPlan com slots formatados
 */

import {
  deleteCacheKeysByPrefix,
  getCachedJson,
  setCachedJson,
} from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import { addDays, getWeekStart } from "@/lib/utils/week";

export interface GetWeeklyPlanInput {
  studentId: string;
  weekOverride?: Date | null;
  activeWeeklyPlanId?: string | null;
  fresh?: boolean;
}

const WEEKLY_PLAN_CACHE_TTL_SECONDS = 15;

function buildWeeklyPlanCacheKey(
  studentId: string,
  activeWeeklyPlanId: string,
  weekStart: Date,
) {
  return [
    "weekly-plan",
    studentId,
    activeWeeklyPlanId,
    weekStart.toISOString(),
    "v2",
  ].join(":");
}

function parseJsonArray(
  value: string | null | undefined,
): string[] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function invalidateWeeklyPlanCache(studentId: string) {
  await deleteCacheKeysByPrefix(`weekly-plan:${studentId}:`);
}

export async function getWeeklyPlanUseCase(input: GetWeeklyPlanInput) {
  const { studentId, weekOverride } = input;

  const weekStart = getWeekStart(weekOverride ?? null);
  const weekEnd = addDays(weekStart, 7);

  const activeWeeklyPlanId =
    input.activeWeeklyPlanId ??
    (
      await db.student.findUnique({
        where: { id: studentId },
        select: { activeWeeklyPlanId: true },
      })
    )?.activeWeeklyPlanId ??
    null;

  if (!activeWeeklyPlanId) {
    return { weeklyPlan: null, weekStart };
  }

  const cacheKey = buildWeeklyPlanCacheKey(
    studentId,
    activeWeeklyPlanId,
    weekStart,
  );
  if (!input.fresh) {
    const cached = await getCachedJson<{ weeklyPlan: unknown }>(cacheKey);
    if (cached?.weeklyPlan) {
      return {
        weeklyPlan: cached.weeklyPlan,
        weekStart,
      };
    }
  }

  const weeklyPlan = await db.weeklyPlan.findUnique({
    where: { id: activeWeeklyPlanId },
    select: {
      id: true,
      title: true,
      description: true,
      sourceLibraryPlanId: true,
      slots: {
        orderBy: { dayOfWeek: "asc" },
        select: {
          id: true,
          dayOfWeek: true,
          type: true,
          workoutId: true,
          workout: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              muscleGroup: true,
              difficulty: true,
              xpReward: true,
              estimatedTime: true,
              exercises: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  name: true,
                  sets: true,
                  reps: true,
                  rest: true,
                  notes: true,
                  videoUrl: true,
                  educationalId: true,
                  primaryMuscles: true,
                  secondaryMuscles: true,
                  difficulty: true,
                  equipment: true,
                  instructions: true,
                  tips: true,
                  commonMistakes: true,
                  benefits: true,
                  scientificEvidence: true,
                  alternatives: { orderBy: { order: "asc" } },
                },
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
          primaryMuscles: parseJsonArray(ex.primaryMuscles),
          secondaryMuscles: parseJsonArray(ex.secondaryMuscles),
          difficulty: ex.difficulty || undefined,
          equipment: parseJsonArray(ex.equipment),
          instructions: parseJsonArray(ex.instructions),
          tips: parseJsonArray(ex.tips),
          commonMistakes: parseJsonArray(ex.commonMistakes),
          benefits: parseJsonArray(ex.benefits),
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

  const result = {
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

  await setCachedJson(
    cacheKey,
    { weeklyPlan: result.weeklyPlan },
    WEEKLY_PLAN_CACHE_TTL_SECONDS,
  );

  return result;
}
