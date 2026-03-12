import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
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
} as const;

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
          orderBy: { order: "asc" };
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

function normalizeFoods(
  foods: NutritionFoodItemInput[] | undefined,
): NormalizedNutritionFoodItem[] {
  return (foods ?? []).map((food, index) => ({
    foodId: food.foodId ?? null,
    foodName: food.foodName,
    servings: food.servings ?? 1,
    calories: Math.round(food.calories ?? 0),
    protein: Number(food.protein ?? 0),
    carbs: Number(food.carbs ?? 0),
    fats: Number(food.fats ?? 0),
    servingSize: food.servingSize ?? "100g",
    order: food.order ?? index,
  }));
}

function normalizeMeals(meals: NutritionMealInput[]): NormalizedNutritionMeal[] {
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
      calories: hasFoods ? totalsFromFoods.calories : Math.round(meal.calories ?? 0),
      protein: hasFoods ? totalsFromFoods.protein : Number(meal.protein ?? 0),
      carbs: hasFoods ? totalsFromFoods.carbs : Number(meal.carbs ?? 0),
      fats: hasFoods ? totalsFromFoods.fats : Number(meal.fats ?? 0),
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
    totalCalories: plan.totalCalories,
    targetProtein: plan.targetProtein,
    targetCarbs: plan.targetCarbs,
    targetFats: plan.targetFats,
    isLibraryTemplate: plan.isLibraryTemplate,
    createdById: plan.createdById,
    creatorType: plan.creatorType,
    sourceLibraryPlanId: plan.sourceLibraryPlanId,
    meals: plan.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      time: meal.time ?? undefined,
      order: meal.order,
      foods: meal.foods.map((food) => ({
        id: food.id,
        foodId: food.foodId ?? undefined,
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
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats,
    time: meal.time ?? undefined,
    completed: meal.completed,
    order: meal.order,
    foods: meal.foods.map((food) => ({
      id: food.id,
      foodId: food.foodId ?? undefined,
      foodName: food.foodName,
      servings: food.servings,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
    })),
  }));

  const totals = computeCompletedTotals(meals);

  return {
    date: options.dateKey,
    meals,
    totalCalories: totals.totalCalories,
    totalProtein: totals.totalProtein,
    totalCarbs: totals.totalCarbs,
    totalFats: totals.totalFats,
    waterIntake: dailyNutrition.waterIntake,
    targetCalories: targets.targetCalories,
    targetProtein: targets.targetProtein,
    targetCarbs: targets.targetCarbs,
    targetFats: targets.targetFats,
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
    targetCalories: profile?.targetCalories ?? DEFAULT_NUTRITION_TARGETS.targetCalories,
    targetProtein: profile?.targetProtein ?? DEFAULT_NUTRITION_TARGETS.targetProtein,
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
  tx: Prisma.TransactionClient,
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
  tx: Prisma.TransactionClient,
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

async function getOrCreateDailyNutrition(
  tx: Prisma.TransactionClient,
  studentId: string,
  dateKey: string,
  waterIntake: number,
) {
  const existing = await findDailyNutritionWithRelations(tx, studentId, dateKey);
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
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
}

async function createDailySnapshotFromPlan(
  tx: Prisma.TransactionClient,
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
  tx: Prisma.TransactionClient,
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

export async function listNutritionLibraryPlans(studentId: string) {
  const plans = await db.nutritionPlan.findMany({
    where: {
      studentId,
      isLibraryTemplate: true,
    },
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
    orderBy: { createdAt: "desc" },
  });

  return plans.map(serializeNutritionPlan);
}

export async function getActiveNutritionPlan(studentId: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { activeNutritionPlanId: true },
  });

  if (!student?.activeNutritionPlanId) {
    return null;
  }

  const plan = await findNutritionPlanWithRelations(db, student.activeNutritionPlanId);
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

  const plan = await db.$transaction(async (tx) => {
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

  return serializeNutritionPlan(plan);
}

export async function updateNutritionLibraryPlan(
  planId: string,
  updates: {
    title?: string;
    description?: string | null;
    meals?: NutritionMealInput[];
  },
) {
  await db.$transaction(async (tx) => {
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

  await syncActiveNutritionPlanFromLibrary(planId);

  const updated = await findNutritionPlanWithRelations(db, planId);
  if (!updated) {
    throw new NutritionDomainError(
      "NUTRITION_PLAN_NOT_FOUND",
      "Nutrition plan not found",
    );
  }

  return serializeNutritionPlan(updated);
}

export async function deleteNutritionLibraryPlan(planId: string) {
  await db.nutritionPlan.delete({
    where: { id: planId },
  });
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

  await db.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
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

    if (student?.activeNutritionPlanId) {
      const previousPlan = await tx.nutritionPlan.findUnique({
        where: { id: student.activeNutritionPlanId },
        select: { id: true, isLibraryTemplate: true },
      });

      if (previousPlan && !previousPlan.isLibraryTemplate) {
        await tx.nutritionPlan.delete({
          where: { id: previousPlan.id },
        });
      }
    }

    await createDailySnapshotFromPlan(
      tx,
      studentId,
      clonedPlan.id,
      currentDateKey,
      currentSnapshot?.waterIntake ?? 0,
    );
  });

  return getActiveNutritionPlan(studentId);
}

export async function syncActiveNutritionPlanFromLibrary(libraryPlanId: string) {
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

  await activateNutritionLibraryPlanForStudent(libraryPlan.studentId, libraryPlanId);
  return { synced: true };
}

export async function getDailyNutritionForStudent(
  studentId: string,
  dateKey: string,
) {
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

  let dailyNutrition = await findDailyNutritionWithRelations(db, studentId, dateKey);

  if (!dailyNutrition && student?.activeNutritionPlanId && isTodayDateKey(dateKey)) {
    dailyNutrition = await db.$transaction(async (tx) =>
      createDailySnapshotFromPlan(
        tx,
        studentId,
        student.activeNutritionPlanId as string,
        dateKey,
        0,
      ),
    );
  }

  return serializeDailyNutritionSnapshot(dailyNutrition, targets, {
    dateKey,
    hasActiveNutritionPlan: Boolean(student?.activeNutritionPlanId),
    isLegacyFallback: Boolean(dailyNutrition && !dailyNutrition.sourceNutritionPlanId),
  });
}

export async function saveDailyNutritionForStudent(params: {
  studentId: string;
  dateKey: string;
  meals?: NutritionMealInput[];
  waterIntake?: number;
  actor: NutritionActorMeta;
}) {
  if (!isTodayDateKey(params.dateKey) && (params.meals !== undefined || params.waterIntake !== undefined)) {
    throw new NutritionDomainError(
      "PAST_DATE_READ_ONLY",
      "Past nutrition dates are read-only",
    );
  }

  await db.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { id: params.studentId },
      select: { activeNutritionPlanId: true },
    });

    let activeNutritionPlanId = student?.activeNutritionPlanId ?? null;
    const currentSnapshot = await findDailyNutritionWithRelations(
      tx,
      params.studentId,
      params.dateKey,
    );
    const nextWaterIntake = params.waterIntake ?? currentSnapshot?.waterIntake ?? 0;

    if (params.meals !== undefined) {
      if (!activeNutritionPlanId) {
        activeNutritionPlanId = await createActivePlanFromMeals(
          tx,
          params.studentId,
          params.actor,
          params.meals,
        );
      } else {
        await replaceNutritionPlanMeals(tx, activeNutritionPlanId, params.meals);
      }
    }

    if (!activeNutritionPlanId && !currentSnapshot && params.waterIntake === undefined) {
      return;
    }

    const dailyNutrition = await getOrCreateDailyNutrition(
      tx,
      params.studentId,
      params.dateKey,
      nextWaterIntake,
    );

    await tx.dailyNutrition.update({
      where: { id: dailyNutrition.id },
      data: {
        waterIntake: nextWaterIntake,
        sourceNutritionPlanId: activeNutritionPlanId,
      },
    });

    if (params.meals !== undefined) {
      await replaceDailyNutritionMeals(tx, dailyNutrition.id, params.meals);
    } else if (!currentSnapshot && activeNutritionPlanId) {
      await createDailySnapshotFromPlan(
        tx,
        params.studentId,
        activeNutritionPlanId,
        params.dateKey,
        nextWaterIntake,
      );
    }
  });

  return getDailyNutritionForStudent(params.studentId, params.dateKey);
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
}

export async function getNutritionLibraryPlanById(planId: string) {
  return findNutritionPlanWithRelations(db, planId);
}

export function isNutritionLibraryError(error: unknown, code: string) {
  return (
    error instanceof NutritionDomainError &&
    error.code === code
  );
}

export function getNutritionLibraryErrorMessage(error: unknown) {
  if (error instanceof NutritionDomainError) {
    return error.message;
  }

  return "Unexpected nutrition error";
}
