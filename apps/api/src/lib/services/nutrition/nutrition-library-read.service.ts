import type { Prisma } from "@prisma/client";
import type { NutritionPlanData } from "@gymrats/types";
import {
  deleteCacheKeys,
  getCachedJson,
  setCachedJson,
} from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";

const NUTRITION_LIBRARY_LIST_TTL_SECONDS = 30;
const NUTRITION_LIBRARY_DETAIL_TTL_SECONDS = 30;

type NutritionPlanWithRelations = Prisma.NutritionPlanGetPayload<{
  include: {
    meals: {
      orderBy: { order: "asc" };
      include: {
        foods: {
          orderBy: { order: "asc" };
        };
      };
    };
  };
}>;

function roundNutritionNumber(value: number | null | undefined) {
  return Math.round(Number(value ?? 0));
}

function buildNutritionLibraryListCacheKey(studentId: string) {
  return `nutrition-library:${studentId}:list:v1`;
}

function buildNutritionLibraryDetailCacheKey(planId: string) {
  return `nutrition-library:${planId}:detail:v1`;
}

function serializeNutritionPlan(plan: NutritionPlanWithRelations): NutritionPlanData {
  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    totalCalories: roundNutritionNumber(plan.totalCalories),
    targetProtein: roundNutritionNumber(plan.targetProtein),
    targetCarbs: roundNutritionNumber(plan.targetCarbs),
    targetFats: roundNutritionNumber(plan.targetFats),
    isLibraryTemplate: plan.isLibraryTemplate,
    createdById: plan.createdById,
    creatorType: plan.creatorType,
    sourceLibraryPlanId: plan.sourceLibraryPlanId,
    meals: plan.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: roundNutritionNumber(meal.calories),
      protein: roundNutritionNumber(meal.protein),
      carbs: roundNutritionNumber(meal.carbs),
      fats: roundNutritionNumber(meal.fats),
      time: meal.time ?? undefined,
      order: meal.order,
      foods: meal.foods.map((food) => ({
        id: food.id,
        foodId: food.foodId ?? undefined,
        foodName: food.foodName,
        servings: food.servings,
        calories: roundNutritionNumber(food.calories),
        protein: roundNutritionNumber(food.protein),
        carbs: roundNutritionNumber(food.carbs),
        fats: roundNutritionNumber(food.fats),
        servingSize: food.servingSize,
        order: food.order,
      })),
    })),
  };
}

function buildNutritionPreview(plan: NutritionPlanWithRelations) {
  return plan.meals
    .map((meal) => meal.name?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, 3)
    .join(" · ");
}

export async function invalidateNutritionLibraryCache(options: {
  studentId: string;
  planId?: string | null;
}) {
  await deleteCacheKeys([
    buildNutritionLibraryListCacheKey(options.studentId),
    options.planId
      ? buildNutritionLibraryDetailCacheKey(options.planId)
      : null,
  ]);
}

export async function listNutritionLibraryPlans(
  studentId: string,
  options: { fresh?: boolean } = {},
) {
  if (!options.fresh) {
    const cached = await getCachedJson<
      Array<NutritionPlanData & { mealCount: number; preview: string }>
    >(buildNutritionLibraryListCacheKey(studentId));
    if (cached) {
      return cached;
    }
  }

  const plans = await db.nutritionPlan.findMany({
    where: {
      studentId,
      isLibraryTemplate: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
      meals: {
        orderBy: { order: "asc" },
        include: {
          foods: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  const payload = plans.map((plan) => ({
    ...serializeNutritionPlan(plan),
    meals: plan.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: roundNutritionNumber(meal.calories),
      protein: roundNutritionNumber(meal.protein),
      carbs: roundNutritionNumber(meal.carbs),
      fats: roundNutritionNumber(meal.fats),
      time: meal.time ?? undefined,
      order: meal.order,
      foods: [],
    })),
    mealCount: plan.meals.length,
    preview: buildNutritionPreview(plan),
  }));

  await setCachedJson(
    buildNutritionLibraryListCacheKey(studentId),
    payload,
    NUTRITION_LIBRARY_LIST_TTL_SECONDS,
  );

  return payload;
}

export async function getNutritionLibraryPlanDetail(
  planId: string,
  options: { fresh?: boolean } = {},
) {
  if (!options.fresh) {
    const cached = await getCachedJson<NutritionPlanData>(
      buildNutritionLibraryDetailCacheKey(planId),
    );
    if (cached) {
      return cached;
    }
  }

  const plan = await db.nutritionPlan.findUnique({
    where: { id: planId },
    include: {
      meals: {
        orderBy: { order: "asc" },
        include: {
          foods: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!plan) {
    return null;
  }

  const payload = serializeNutritionPlan(plan);
  await setCachedJson(
    buildNutritionLibraryDetailCacheKey(planId),
    payload,
    NUTRITION_LIBRARY_DETAIL_TTL_SECONDS,
  );

  return payload;
}
