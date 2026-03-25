import type { WeeklyPlanData } from "@gymrats/types";
import type { Prisma } from "@prisma/client";
import {
  deleteCacheKeys,
  getCachedJson,
  setCachedJson,
} from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";

const TRAINING_LIBRARY_LIST_TTL_SECONDS = 30;
const TRAINING_LIBRARY_DETAIL_TTL_SECONDS = 30;

function buildTrainingLibraryListCacheKey(studentId: string) {
  return `training-library:${studentId}:list:v1`;
}

function buildTrainingLibraryDetailCacheKey(planId: string) {
  return `training-library:${planId}:detail:v2`;
}

type TrainingLibraryPlanDetail = Prisma.WeeklyPlanGetPayload<{
  include: {
    slots: {
      orderBy: { dayOfWeek: "asc" };
      include: {
        workout: {
          include: {
            exercises: {
              orderBy: { order: "asc" };
            };
          };
        };
      };
    };
  };
}>;

function buildTrainingLibraryPreview(
  slots: Array<{
    type: string;
    workout?: { title: string | null } | null;
  }>,
) {
  return slots
    .filter((slot) => slot.type === "workout")
    .map((slot) => slot.workout?.title?.trim())
    .filter((title): title is string => Boolean(title))
    .slice(0, 3)
    .join(" · ");
}

export async function invalidateTrainingLibraryCache(options: {
  studentId: string;
  planId?: string | null;
}) {
  await deleteCacheKeys([
    buildTrainingLibraryListCacheKey(options.studentId),
    options.planId ? buildTrainingLibraryDetailCacheKey(options.planId) : null,
  ]);
}

export async function listTrainingLibraryPlans(
  studentId: string,
  options: { fresh?: boolean } = {},
) {
  if (!options.fresh) {
    const cached = await getCachedJson<
      Array<WeeklyPlanData & Record<string, unknown>>
    >(buildTrainingLibraryListCacheKey(studentId));
    if (cached) {
      return cached;
    }
  }

  const plans = await db.weeklyPlan.findMany({
    where: {
      studentId,
      ...({ isLibraryTemplate: true } as const),
    },
    select: {
      id: true,
      title: true,
      description: true,
      isLibraryTemplate: true,
      createdById: true,
      creatorType: true,
      sourceLibraryPlanId: true,
      updatedAt: true,
      slots: {
        orderBy: { dayOfWeek: "asc" },
        select: {
          id: true,
          dayOfWeek: true,
          type: true,
          workout: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const payload = plans.map((plan) => {
    const workoutDays = plan.slots.filter(
      (slot) => slot.type === "workout",
    ).length;
    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      isLibraryTemplate: plan.isLibraryTemplate,
      createdById: plan.createdById,
      creatorType: plan.creatorType,
      sourceLibraryPlanId: plan.sourceLibraryPlanId,
      updatedAt: plan.updatedAt,
      slotCount: plan.slots.length,
      estimatedDays: workoutDays,
      preview: buildTrainingLibraryPreview(plan.slots),
      slots: plan.slots.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        type: slot.type,
        locked: false,
        completed: slot.type === "rest",
      })),
    };
  });

  await setCachedJson(
    buildTrainingLibraryListCacheKey(studentId),
    payload,
    TRAINING_LIBRARY_LIST_TTL_SECONDS,
  );

  return payload;
}

export async function getTrainingLibraryPlanDetail(
  planId: string,
  options: { fresh?: boolean } = {},
) {
  if (!options.fresh) {
    const cached = await getCachedJson<TrainingLibraryPlanDetail>(
      buildTrainingLibraryDetailCacheKey(planId),
    );
    if (cached) {
      return cached;
    }
  }

  const plan = await db.weeklyPlan.findUnique({
    where: { id: planId },
    include: {
      slots: {
        orderBy: { dayOfWeek: "asc" },
        include: {
          workout: {
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return null;
  }

  await setCachedJson(
    buildTrainingLibraryDetailCacheKey(planId),
    plan,
    TRAINING_LIBRARY_DETAIL_TTL_SECONDS,
  );

  return plan;
}
