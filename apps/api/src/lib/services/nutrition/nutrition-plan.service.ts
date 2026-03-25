import { Prisma } from "@prisma/client";
import {
  deleteCacheKeys,
  getCachedJson,
  setCachedJson,
} from "@/lib/cache/resource-cache";
import { db } from "@/lib/db";
import {
  getNutritionLibraryPlanDetail as getNutritionLibraryPlanDetailCached,
  invalidateNutritionLibraryCache,
  listNutritionLibraryPlans as listNutritionLibraryPlanSummaries,
} from "@/lib/services/nutrition/nutrition-library-read.service";
import {
  getBrazilNutritionDateKey,
  getBrazilNutritionDayRange,
} from "@/lib/utils/brazil-nutrition-date";

const DEFAULT_NUTRITION_TARGETS = {
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 250,
  targetFats: 65,
  targetWater: 3000,
};
const pendingNutritionWriteQueues = new Map<string, Promise<void>>();
const NUTRITION_TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 30_000,
} as const;
const DAILY_NUTRITION_CACHE_TTL_SECONDS = 15;

function buildDailyNutritionCacheKey(studentId: string, dateKey: string) {
  return `daily-nutrition:${studentId}:${dateKey}:v1`;
}

async function invalidateDailyNutritionCache(
  studentId: string,
  dateKey?: string | null,
) {
  await deleteCacheKeys([
    dateKey ? buildDailyNutritionCacheKey(studentId, dateKey) : null,
  ]);
}

export type NutritionActorType = "STUDENT" | "GYM" | "PERSONAL";

export interface NutritionActorMeta {
  createdById: string | null;
  creatorType: NutritionActorType;
}

export interface NutritionFoodItemInput {
  foodId?: string | null;
  foodName: string;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  servingSize?: string | null;
  order?: number;
}

export interface NutritionMealInput {
  name: string;
  type: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  time?: string | null;
  completed?: boolean;
  order?: number;
  foods?: NutritionFoodItemInput[];
}

interface NormalizedNutritionFoodItem {
  foodId: string | null;
  foodName: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  order: number;
}

interface NormalizedNutritionMeal {
  name: string;
  type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string | null;
  completed: boolean;
  order: number;
  foods: NormalizedNutritionFoodItem[];
}

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

type DailyNutritionWithRelations = Prisma.DailyNutritionGetPayload<{
  include: {
    meals: {
      orderBy: { order: "asc" };
      include: {
        foods: {
          orderBy: { createdAt: "asc" };
        };
      };
    };
  };
}>;

class NutritionDomainError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function isRetryableNutritionTransactionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2028"
  );
}

async function retryNutritionWrite<T>(
  operation: () => Promise<T>,
  label: string,
  maxAttempts: number = 2,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (
        !isRetryableNutritionTransactionError(error) ||
        attempt >= maxAttempts
      ) {
        throw error;
      }

      console.warn(
        `[nutrition] Retry ${attempt}/${maxAttempts - 1} for ${label} after Prisma transaction race`,
      );
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }

  throw lastError;
}

async function queueNutritionWrite<T>(
  key: string,
  operation: () => Promise<T>,
) {
  const previousWrite =
    pendingNutritionWriteQueues.get(key) ?? Promise.resolve();
  let result!: T;

  const request = previousWrite
    .catch(() => undefined)
    .then(async () => {
      result = await operation();
    });

  let trackedRequest: Promise<void>;
  trackedRequest = request.finally(() => {
    if (pendingNutritionWriteQueues.get(key) === trackedRequest) {
      pendingNutritionWriteQueues.delete(key);
    }
  });

  pendingNutritionWriteQueues.set(key, trackedRequest);
  await trackedRequest;
  return result;
}

async function runNutritionTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(
    async (tx) => operation(tx),
    NUTRITION_TRANSACTION_OPTIONS,
  );
}

function roundNutritionNumber(value: number | null | undefined) {
  return Math.round(Number(value ?? 0));
}

function normalizeFoods(
  foods: NutritionFoodItemInput[] | undefined,
): NormalizedNutritionFoodItem[] {
  return (foods ?? []).map((food, index) => ({
    foodId: food.foodId ?? null,
    foodName: food.foodName,
    servings: food.servings ?? 1,
    calories: roundNutritionNumber(food.calories),
    protein: roundNutritionNumber(food.protein),
    carbs: roundNutritionNumber(food.carbs),
    fats: roundNutritionNumber(food.fats),
    servingSize: food.servingSize ?? "100g",
    order: food.order ?? index,
  }));
}

function normalizeMeals(
  meals: NutritionMealInput[],
): NormalizedNutritionMeal[] {
  return meals.map((meal, index) => {
    const foods = normalizeFoods(meal.foods);
    const totalsFromFoods = foods.reduce(
      (accumulator, food) => ({
        calories: accumulator.calories + food.calories,
        protein: accumulator.protein + food.protein,
        carbs: accumulator.carbs + food.carbs,
        fats: accumulator.fats + food.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    );

    const hasFoods = foods.length > 0;

    return {
      name: meal.name,
      type: meal.type,
      calories: hasFoods
        ? roundNutritionNumber(totalsFromFoods.calories)
        : roundNutritionNumber(meal.calories),
      protein: hasFoods
        ? roundNutritionNumber(totalsFromFoods.protein)
        : roundNutritionNumber(meal.protein),
      carbs: hasFoods
        ? roundNutritionNumber(totalsFromFoods.carbs)
        : roundNutritionNumber(meal.carbs),
      fats: hasFoods
        ? roundNutritionNumber(totalsFromFoods.fats)
        : roundNutritionNumber(meal.fats),
      time: meal.time ?? null,
      completed: Boolean(meal.completed),
      order: meal.order ?? index,
      foods,
    };
  });
}

function computePlanTotals(meals: NormalizedNutritionMeal[]) {
  return meals.reduce(
    (accumulator, meal) => ({
      totalCalories: accumulator.totalCalories + meal.calories,
      targetProtein: accumulator.targetProtein + meal.protein,
      targetCarbs: accumulator.targetCarbs + meal.carbs,
      targetFats: accumulator.targetFats + meal.fats,
    }),
    {
      totalCalories: 0,
      targetProtein: 0,
      targetCarbs: 0,
      targetFats: 0,
    },
  );
}

function computeCompletedTotals(
  meals: Array<{
    completed?: boolean;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>,
) {
  return meals
    .filter((meal) => meal.completed === true)
    .reduce(
      (accumulator, meal) => ({
        totalCalories: accumulator.totalCalories + meal.calories,
        totalProtein: accumulator.totalProtein + meal.protein,
        totalCarbs: accumulator.totalCarbs + meal.carbs,
        totalFats: accumulator.totalFats + meal.fats,
      }),
      {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
      },
    );
}

function serializeNutritionPlan(plan: NutritionPlanWithRelations) {
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

function serializeDailyNutritionSnapshot(
  dailyNutrition: DailyNutritionWithRelations | null,
  targets: typeof DEFAULT_NUTRITION_TARGETS,
  options: {
    dateKey: string;
    hasActiveNutritionPlan: boolean;
    isLegacyFallback: boolean;
  },
) {
  if (!dailyNutrition) {
    return {
      date: options.dateKey,
      meals: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      waterIntake: 0,
      targetCalories: targets.targetCalories,
      targetProtein: targets.targetProtein,
      targetCarbs: targets.targetCarbs,
      targetFats: targets.targetFats,
      targetWater: targets.targetWater,
      sourceNutritionPlanId: null,
      hasActiveNutritionPlan: options.hasActiveNutritionPlan,
      isLegacyFallback: options.isLegacyFallback,
    };
  }

  const meals = dailyNutrition.meals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    type: meal.type,
    calories: roundNutritionNumber(meal.calories),
    protein: roundNutritionNumber(meal.protein),
    carbs: roundNutritionNumber(meal.carbs),
    fats: roundNutritionNumber(meal.fats),
    time: meal.time ?? undefined,
    completed: meal.completed,
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
    })),
  }));

  const totals = computeCompletedTotals(meals);

  return {
    date: options.dateKey,
    meals,
    totalCalories: roundNutritionNumber(totals.totalCalories),
    totalProtein: roundNutritionNumber(totals.totalProtein),
    totalCarbs: roundNutritionNumber(totals.totalCarbs),
    totalFats: roundNutritionNumber(totals.totalFats),
    waterIntake: dailyNutrition.waterIntake,
    targetCalories: roundNutritionNumber(targets.targetCalories),
    targetProtein: roundNutritionNumber(targets.targetProtein),
    targetCarbs: roundNutritionNumber(targets.targetCarbs),
    targetFats: roundNutritionNumber(targets.targetFats),
    targetWater: targets.targetWater,
    sourceNutritionPlanId: dailyNutrition.sourceNutritionPlanId,
    hasActiveNutritionPlan: options.hasActiveNutritionPlan,
    isLegacyFallback: options.isLegacyFallback,
  };
}

async function getNutritionTargets(studentId: string) {
  const profile = await db.studentProfile.findUnique({
    where: { studentId },
    select: {
      targetCalories: true,
      targetProtein: true,
      targetCarbs: true,
      targetFats: true,
      targetWater: true,
    },
  });

  return {
    targetCalories:
      profile?.targetCalories ?? DEFAULT_NUTRITION_TARGETS.targetCalories,
    targetProtein:
      profile?.targetProtein ?? DEFAULT_NUTRITION_TARGETS.targetProtein,
    targetCarbs: profile?.targetCarbs ?? DEFAULT_NUTRITION_TARGETS.targetCarbs,
    targetFats: profile?.targetFats ?? DEFAULT_NUTRITION_TARGETS.targetFats,
    targetWater: profile?.targetWater ?? DEFAULT_NUTRITION_TARGETS.targetWater,
  };
}

async function findDailyNutritionWithRelations(
  tx: Prisma.TransactionClient | typeof db,
  studentId: string,
  dateKey: string,
) {
  const { start, end } = getBrazilNutritionDayRange(dateKey);

  return tx.dailyNutrition.findFirst({
    where: {
      studentId,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      meals: {
        orderBy: { order: "asc" },
        include: {
          foods: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

async function findNutritionPlanWithRelations(
  tx: Prisma.TransactionClient | typeof db,
  planId: string,
) {
  return tx.nutritionPlan.findUnique({
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
}

async function replaceNutritionPlanMeals(
  tx: Prisma.TransactionClient | typeof db,
  nutritionPlanId: string,
  meals: NutritionMealInput[],
) {
  const normalizedMeals = normalizeMeals(meals);

  await tx.nutritionPlanMeal.deleteMany({
    where: { nutritionPlanId },
  });

  for (const meal of normalizedMeals) {
    const createdMeal = await tx.nutritionPlanMeal.create({
      data: {
        nutritionPlanId,
        name: meal.name,
        type: meal.type,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        time: meal.time,
        order: meal.order,
      },
    });

    if (meal.foods.length > 0) {
      await tx.nutritionPlanFoodItem.createMany({
        data: meal.foods.map((food) => ({
          nutritionPlanMealId: createdMeal.id,
          foodId: food.foodId,
          foodName: food.foodName,
          servings: food.servings,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
          servingSize: food.servingSize,
          order: food.order,
        })),
      });
    }
  }

  const totals = computePlanTotals(normalizedMeals);

  await tx.nutritionPlan.update({
    where: { id: nutritionPlanId },
    data: totals,
  });
}

async function replaceDailyNutritionMeals(
  tx: Prisma.TransactionClient | typeof db,
  dailyNutritionId: string,
  meals: NutritionMealInput[],
) {
  const normalizedMeals = normalizeMeals(meals);

  await tx.nutritionMeal.deleteMany({
    where: { dailyNutritionId },
  });

  for (const meal of normalizedMeals) {
    const createdMeal = await tx.nutritionMeal.create({
      data: {
        dailyNutritionId,
        name: meal.name,
        type: meal.type,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        time: meal.time,
        completed: meal.completed,
        order: meal.order,
      },
    });

    if (meal.foods.length > 0) {
      await tx.nutritionFoodItem.createMany({
        data: meal.foods.map((food) => ({
          nutritionMealId: createdMeal.id,
          foodId: food.foodId,
          foodName: food.foodName,
          servings: food.servings,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
          servingSize: food.servingSize,
        })),
      });
    }
  }
}

function hasSameNormalizedFoodStructure(
  existingFoods: DailyNutritionWithRelations["meals"][number]["foods"],
  nextFoods: NormalizedNutritionFoodItem[],
) {
  if (existingFoods.length !== nextFoods.length) {
    return false;
  }

  for (let index = 0; index < existingFoods.length; index += 1) {
    const existingFood = existingFoods[index];
    const nextFood = nextFoods[index];

    if (
      (existingFood.foodId ?? null) !== nextFood.foodId ||
      existingFood.foodName !== nextFood.foodName ||
      roundNutritionNumber(existingFood.servings) !== nextFood.servings ||
      roundNutritionNumber(existingFood.calories) !== nextFood.calories ||
      roundNutritionNumber(existingFood.protein) !== nextFood.protein ||
      roundNutritionNumber(existingFood.carbs) !== nextFood.carbs ||
      roundNutritionNumber(existingFood.fats) !== nextFood.fats ||
      existingFood.servingSize !== nextFood.servingSize
    ) {
      return false;
    }
  }

  return true;
}

function hasSameDailyMealStructure(
  existingMeals: DailyNutritionWithRelations["meals"],
  nextMeals: NutritionMealInput[],
) {
  const normalizedMeals = normalizeMeals(nextMeals);

  if (existingMeals.length !== normalizedMeals.length) {
    return false;
  }

  for (let index = 0; index < existingMeals.length; index += 1) {
    const existingMeal = existingMeals[index];
    const nextMeal = normalizedMeals[index];

    if (
      existingMeal.name !== nextMeal.name ||
      existingMeal.type !== nextMeal.type ||
      roundNutritionNumber(existingMeal.calories) !== nextMeal.calories ||
      roundNutritionNumber(existingMeal.protein) !== nextMeal.protein ||
      roundNutritionNumber(existingMeal.carbs) !== nextMeal.carbs ||
      roundNutritionNumber(existingMeal.fats) !== nextMeal.fats ||
      existingMeal.time !== nextMeal.time ||
      existingMeal.order !== nextMeal.order ||
      !hasSameNormalizedFoodStructure(existingMeal.foods, nextMeal.foods)
    ) {
      return false;
    }
  }

  return true;
}

async function updateDailyNutritionMealChecks(
  tx: Prisma.TransactionClient | typeof db,
  snapshot: DailyNutritionWithRelations,
  meals: NutritionMealInput[],
) {
  const normalizedMeals = normalizeMeals(meals);

  for (let index = 0; index < snapshot.meals.length; index += 1) {
    const existingMeal = snapshot.meals[index];
    const nextMeal = normalizedMeals[index];

    if (!nextMeal || existingMeal.completed === nextMeal.completed) {
      continue;
    }

    await tx.nutritionMeal.update({
      where: { id: existingMeal.id },
      data: { completed: nextMeal.completed },
    });
  }
}

async function getOrCreateDailyNutrition(
  tx: Prisma.TransactionClient | typeof db,
  studentId: string,
  dateKey: string,
  waterIntake: number,
) {
  const existing = await findDailyNutritionWithRelations(
    tx,
    studentId,
    dateKey,
  );
  if (existing) {
    return existing;
  }

  const { start } = getBrazilNutritionDayRange(dateKey);

  return tx.dailyNutrition.create({
    data: {
      studentId,
      date: start,
      waterIntake,
    },
    include: {
      meals: {
        orderBy: { order: "asc" },
        include: {
          foods: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
}

async function createDailySnapshotFromPlan(
  tx: Prisma.TransactionClient | typeof db,
  studentId: string,
  nutritionPlanId: string,
  dateKey: string,
  waterIntake: number,
) {
  const plan = await findNutritionPlanWithRelations(tx, nutritionPlanId);

  if (!plan) {
    throw new NutritionDomainError(
      "NUTRITION_PLAN_NOT_FOUND",
      "Nutrition plan not found",
    );
  }

  const dailyNutrition = await getOrCreateDailyNutrition(
    tx,
    studentId,
    dateKey,
    waterIntake,
  );

  await tx.dailyNutrition.update({
    where: { id: dailyNutrition.id },
    data: {
      waterIntake,
      sourceNutritionPlanId: nutritionPlanId,
    },
  });

  await replaceDailyNutritionMeals(
    tx,
    dailyNutrition.id,
    plan.meals.map((meal) => ({
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      time: meal.time,
      completed: false,
      order: meal.order,
      foods: meal.foods.map((food) => ({
        foodId: food.foodId,
        foodName: food.foodName,
        servings: food.servings,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        servingSize: food.servingSize,
        order: food.order,
      })),
    })),
  );

  return findDailyNutritionWithRelations(tx, studentId, dateKey);
}

async function createActivePlanFromMeals(
  tx: Prisma.TransactionClient | typeof db,
  studentId: string,
  actor: NutritionActorMeta,
  meals: NutritionMealInput[],
) {
  const plan = await tx.nutritionPlan.create({
    data: {
      studentId,
      title: "Meu Plano Alimentar",
      isLibraryTemplate: false,
      createdById: actor.createdById,
      creatorType: actor.creatorType,
    },
  });

  await replaceNutritionPlanMeals(tx, plan.id, meals);

  await tx.student.update({
    where: { id: studentId },
    data: { activeNutritionPlanId: plan.id },
  });

  return plan.id;
}

function isTodayDateKey(dateKey: string) {
  return dateKey === getBrazilNutritionDateKey();
}

export async function listNutritionLibraryPlans(
  studentId: string,
  options: { fresh?: boolean } = {},
) {
  return listNutritionLibraryPlanSummaries(studentId, options);
}

export async function getActiveNutritionPlan(studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { activeNutritionPlanId: true },
  });

  if (!student?.activeNutritionPlanId) {
    return null;
  }

  const plan = await findNutritionPlanWithRelations(
    db,
    student.activeNutritionPlanId,
  );
  return plan ? serializeNutritionPlan(plan) : null;
}

export async function createNutritionLibraryPlan(params: {
  studentId: string;
  title?: string;
  description?: string | null;
  meals?: NutritionMealInput[];
  actor: NutritionActorMeta;
}) {
  if (params.actor.creatorType !== "STUDENT" && params.actor.createdById) {
    const existing = await db.nutritionPlan.findFirst({
      where: {
        studentId: params.studentId,
        isLibraryTemplate: true,
        createdById: params.actor.createdById,
      },
    });

    if (existing) {
      throw new NutritionDomainError(
        "LIBRARY_PLAN_LIMIT_REACHED",
        "This creator already has a nutrition plan for the student",
      );
    }
  }

  const plan = await runNutritionTransaction(async (tx) => {
    const createdPlan = await tx.nutritionPlan.create({
      data: {
        studentId: params.studentId,
        title: params.title || "Novo Plano Alimentar",
        description: params.description ?? null,
        isLibraryTemplate: true,
        createdById: params.actor.createdById,
        creatorType: params.actor.creatorType,
      },
    });

    if (params.meals !== undefined) {
      await replaceNutritionPlanMeals(tx, createdPlan.id, params.meals);
    }

    return findNutritionPlanWithRelations(tx, createdPlan.id);
  });

  if (!plan) {
    throw new NutritionDomainError(
      "NUTRITION_PLAN_NOT_FOUND",
      "Nutrition plan not found",
    );
  }

  const payload = serializeNutritionPlan(plan);
  await invalidateNutritionLibraryCache({
    studentId: params.studentId,
    planId: payload.id,
  });
  return payload;
}

export async function updateNutritionLibraryPlan(
  planId: string,
  updates: {
    title?: string;
    description?: string | null;
    meals?: NutritionMealInput[];
  },
) {
  return queueNutritionWrite(`nutrition-library:${planId}`, async () => {
    await retryNutritionWrite(async () => {
      await runNutritionTransaction(async (tx) => {
        if (updates.title !== undefined || updates.description !== undefined) {
          await tx.nutritionPlan.update({
            where: { id: planId },
            data: {
              ...(updates.title !== undefined && { title: updates.title }),
              ...(updates.description !== undefined && {
                description: updates.description,
              }),
            },
          });
        }

        if (updates.meals !== undefined) {
          await replaceNutritionPlanMeals(tx, planId, updates.meals);
        }
      });
    }, `updateNutritionLibraryPlan:${planId}`);

    await syncActiveNutritionPlanFromLibrary(planId);

    const updated = await findNutritionPlanWithRelations(db, planId);
    if (!updated) {
      throw new NutritionDomainError(
        "NUTRITION_PLAN_NOT_FOUND",
        "Nutrition plan not found",
      );
    }

    const payload = serializeNutritionPlan(updated);
    await invalidateNutritionLibraryCache({
      studentId: updated.studentId,
      planId,
    });
    return payload;
  });
}

export async function deleteNutritionLibraryPlan(planId: string) {
  const plan = await db.nutritionPlan.findUnique({
    where: { id: planId },
    select: {
      studentId: true,
    },
  });
  await db.nutritionPlan.delete({
    where: { id: planId },
  });
  if (plan?.studentId) {
    await invalidateNutritionLibraryCache({
      studentId: plan.studentId,
      planId,
    });
  }
}

export async function activateNutritionLibraryPlanForStudent(
  studentId: string,
  libraryPlanId: string,
) {
  const masterPlan = await findNutritionPlanWithRelations(db, libraryPlanId);

  if (!masterPlan || !masterPlan.isLibraryTemplate) {
    throw new NutritionDomainError(
      "NUTRITION_LIBRARY_PLAN_NOT_FOUND",
      "Nutrition library plan not found",
    );
  }

  if (masterPlan.studentId !== studentId) {
    throw new NutritionDomainError(
      "NUTRITION_LIBRARY_PLAN_FORBIDDEN",
      "The student does not have access to this nutrition plan",
    );
  }

  await runNutritionTransaction(async (tx) => {
    const _student = await tx.student.findUnique({
      where: { id: studentId },
      select: { activeNutritionPlanId: true },
    });
    const currentDateKey = getBrazilNutritionDateKey();
    const currentSnapshot = await findDailyNutritionWithRelations(
      tx,
      studentId,
      currentDateKey,
    );

    const clonedPlan = await tx.nutritionPlan.create({
      data: {
        studentId,
        title: masterPlan.title,
        description: masterPlan.description,
        totalCalories: masterPlan.totalCalories,
        targetProtein: masterPlan.targetProtein,
        targetCarbs: masterPlan.targetCarbs,
        targetFats: masterPlan.targetFats,
        isLibraryTemplate: false,
        createdById: masterPlan.createdById,
        creatorType: masterPlan.creatorType,
        sourceLibraryPlanId: libraryPlanId,
      },
    });

    await replaceNutritionPlanMeals(
      tx,
      clonedPlan.id,
      masterPlan.meals.map((meal) => ({
        name: meal.name,
        type: meal.type,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        time: meal.time,
        order: meal.order,
        foods: meal.foods.map((food) => ({
          foodId: food.foodId,
          foodName: food.foodName,
          servings: food.servings,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fats: food.fats,
          servingSize: food.servingSize,
          order: food.order,
        })),
      })),
    );

    await tx.student.update({
      where: { id: studentId },
      data: { activeNutritionPlanId: clonedPlan.id },
    });

    await createDailySnapshotFromPlan(
      tx,
      studentId,
      clonedPlan.id,
      currentDateKey,
      currentSnapshot?.waterIntake ?? 0,
    );
  });

  await invalidateDailyNutritionCache(studentId, getBrazilNutritionDateKey());
  await invalidateNutritionLibraryCache({
    studentId,
    planId: libraryPlanId,
  });
  return getActiveNutritionPlan(studentId);
}

export async function syncActiveNutritionPlanFromLibrary(
  libraryPlanId: string,
) {
  const libraryPlan = await db.nutritionPlan.findUnique({
    where: { id: libraryPlanId },
    select: {
      id: true,
      studentId: true,
      isLibraryTemplate: true,
    },
  });

  if (!libraryPlan?.isLibraryTemplate) {
    return { synced: false };
  }

  const student = await db.student.findUnique({
    where: { id: libraryPlan.studentId },
    select: { activeNutritionPlanId: true },
  });

  if (!student?.activeNutritionPlanId) {
    return { synced: false };
  }

  const activePlan = await db.nutritionPlan.findUnique({
    where: { id: student.activeNutritionPlanId },
    select: {
      isLibraryTemplate: true,
      sourceLibraryPlanId: true,
    },
  });

  if (
    !activePlan ||
    activePlan.isLibraryTemplate ||
    activePlan.sourceLibraryPlanId !== libraryPlanId
  ) {
    return { synced: false };
  }

  await activateNutritionLibraryPlanForStudent(
    libraryPlan.studentId,
    libraryPlanId,
  );
  return { synced: true };
}

function serializeDailyNutritionPlanFallback(params: {
  plan: NutritionPlanWithRelations;
  targets: typeof DEFAULT_NUTRITION_TARGETS;
  dateKey: string;
}) {
  const { dateKey, plan, targets } = params;
  return {
    date: dateKey,
    meals: plan.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: roundNutritionNumber(meal.calories),
      protein: roundNutritionNumber(meal.protein),
      carbs: roundNutritionNumber(meal.carbs),
      fats: roundNutritionNumber(meal.fats),
      time: meal.time ?? undefined,
      completed: false,
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
      })),
    })),
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    waterIntake: 0,
    targetCalories: roundNutritionNumber(targets.targetCalories),
    targetProtein: roundNutritionNumber(targets.targetProtein),
    targetCarbs: roundNutritionNumber(targets.targetCarbs),
    targetFats: roundNutritionNumber(targets.targetFats),
    targetWater: targets.targetWater,
    sourceNutritionPlanId: plan.id,
    hasActiveNutritionPlan: true,
    isLegacyFallback: false,
  };
}

export async function getDailyNutritionForStudent(
  studentId: string,
  dateKey: string,
  options: { fresh?: boolean } = {},
) {
  const cacheKey = buildDailyNutritionCacheKey(studentId, dateKey);
  if (!options.fresh) {
    const cached =
      await getCachedJson<ReturnType<typeof serializeDailyNutritionSnapshot>>(
        cacheKey,
      );
    if (cached) {
      return cached;
    }
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      activeNutritionPlanId: true,
      activeNutritionPlan: {
        select: {
          totalCalories: true,
          targetProtein: true,
          targetCarbs: true,
          targetFats: true,
        },
      },
    },
  });
  const baseTargets = await getNutritionTargets(studentId);
  const targets = {
    ...baseTargets,
    ...(student?.activeNutritionPlanId
      ? {
          targetCalories: student.activeNutritionPlan?.totalCalories ?? 0,
          targetProtein: student.activeNutritionPlan?.targetProtein ?? 0,
          targetCarbs: student.activeNutritionPlan?.targetCarbs ?? 0,
          targetFats: student.activeNutritionPlan?.targetFats ?? 0,
        }
      : {}),
  };

  const dailyNutrition = await findDailyNutritionWithRelations(
    db,
    studentId,
    dateKey,
  );

  let payload = serializeDailyNutritionSnapshot(dailyNutrition, targets, {
    dateKey,
    hasActiveNutritionPlan: Boolean(student?.activeNutritionPlanId),
    isLegacyFallback: Boolean(
      dailyNutrition && !dailyNutrition.sourceNutritionPlanId,
    ),
  });

  if (!dailyNutrition && student?.activeNutritionPlanId) {
    const activePlan = await findNutritionPlanWithRelations(
      db,
      student.activeNutritionPlanId,
    );
    if (activePlan) {
      payload = serializeDailyNutritionPlanFallback({
        plan: activePlan,
        targets,
        dateKey,
      });
    }
  }

  await setCachedJson(cacheKey, payload, DAILY_NUTRITION_CACHE_TTL_SECONDS);
  return payload;
}

export async function saveDailyNutritionForStudent(params: {
  studentId: string;
  dateKey: string;
  meals?: NutritionMealInput[];
  syncPlan?: boolean;
  waterIntake?: number;
  actor: NutritionActorMeta;
}) {
  if (
    !isTodayDateKey(params.dateKey) &&
    (params.meals !== undefined || params.waterIntake !== undefined)
  ) {
    throw new NutritionDomainError(
      "PAST_DATE_READ_ONLY",
      "Past nutrition dates are read-only",
    );
  }

  return queueNutritionWrite(
    `daily-nutrition:${params.studentId}:${params.dateKey}`,
    async () => {
      await retryNutritionWrite(async () => {
        const student = await db.student.findUnique({
          where: { id: params.studentId },
          select: { activeNutritionPlanId: true },
        });

        let activeNutritionPlanId = student?.activeNutritionPlanId ?? null;
        const currentSnapshot = await findDailyNutritionWithRelations(
          db,
          params.studentId,
          params.dateKey,
        );
        const nextWaterIntake =
          params.waterIntake ?? currentSnapshot?.waterIntake ?? 0;
        const shouldSyncPlan = params.syncPlan ?? true;

        if (params.meals !== undefined) {
          if (shouldSyncPlan && !activeNutritionPlanId) {
            activeNutritionPlanId = await createActivePlanFromMeals(
              db,
              params.studentId,
              params.actor,
              params.meals,
            );
          } else if (shouldSyncPlan && activeNutritionPlanId) {
            await replaceNutritionPlanMeals(
              db,
              activeNutritionPlanId,
              params.meals,
            );
          }
        }

        if (
          !activeNutritionPlanId &&
          !currentSnapshot &&
          params.waterIntake === undefined
        ) {
          return;
        }

        const dailyNutrition = await getOrCreateDailyNutrition(
          db,
          params.studentId,
          params.dateKey,
          nextWaterIntake,
        );

        await db.dailyNutrition.update({
          where: { id: dailyNutrition.id },
          data: {
            waterIntake: nextWaterIntake,
            sourceNutritionPlanId: activeNutritionPlanId,
          },
        });

        if (params.meals !== undefined) {
          const canFastUpdateChecksOnly =
            !shouldSyncPlan &&
            currentSnapshot &&
            hasSameDailyMealStructure(currentSnapshot.meals, params.meals);

          if (canFastUpdateChecksOnly) {
            await updateDailyNutritionMealChecks(
              db,
              currentSnapshot,
              params.meals,
            );
          } else {
            await replaceDailyNutritionMeals(
              db,
              dailyNutrition.id,
              params.meals,
            );
          }
        } else if (!currentSnapshot && activeNutritionPlanId) {
          await createDailySnapshotFromPlan(
            db,
            params.studentId,
            activeNutritionPlanId,
            params.dateKey,
            nextWaterIntake,
          );
        }
      }, `saveDailyNutritionForStudent:${params.studentId}:${params.dateKey}`);

      await invalidateDailyNutritionCache(params.studentId, params.dateKey);
      return getDailyNutritionForStudent(params.studentId, params.dateKey, {
        fresh: true,
      });
    },
  );
}

export async function updateStudentTargetWater(
  studentId: string,
  targetWater: number,
) {
  await db.studentProfile.upsert({
    where: { studentId },
    create: { studentId, targetWater },
    update: { targetWater },
  });
  await invalidateDailyNutritionCache(studentId, getBrazilNutritionDateKey());
}

export async function getNutritionLibraryPlanById(planId: string) {
  return getNutritionLibraryPlanDetailCached(planId, { fresh: true });
}

export function isNutritionLibraryError(error: unknown, code: string) {
  return error instanceof NutritionDomainError && error.code === code;
}

export function getNutritionLibraryErrorMessage(error: unknown) {
  if (error instanceof NutritionDomainError) {
    return error.message;
  }

  return "Unexpected nutrition error";
}
