import { z } from "zod";

/**
 * Schemas de validação para rotas de nutrição
 */

const nutritionFoodItemSchema = z.object({
  foodId: z.string().optional().nullable(),
  foodName: z.string().min(1, "foodName é obrigatório"),
  servings: z.number().positive().optional(),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fats: z.number().nonnegative().optional(),
  servingSize: z.string().optional(),
});

const nutritionMealSchema = z.object({
  name: z.string().min(1, "Nome da refeição é obrigatório"),
  type: z.enum(
    [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "afternoon-snack",
      "pre-workout",
      "post-workout",
    ],
    {
      errorMap: () => ({
        message:
          "Tipo deve ser breakfast, lunch, dinner, snack, afternoon-snack, pre-workout ou post-workout",
      }),
    }
  ),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fats: z.number().nonnegative().optional(),
  time: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
  foods: z.array(nutritionFoodItemSchema).optional(),
});

export const updateDailyNutritionSchema = z.object({
  date: z
    .union([
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
      z.string().datetime(),
    ])
    .optional(),
  meals: z.array(nutritionMealSchema).optional(),
  waterIntake: z.number().int().nonnegative().optional(),
});

export const dailyNutritionUpdateSchema = updateDailyNutritionSchema;

export const dailyNutritionQuerySchema = z.object({
  date: z
    .string()
    .datetime()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

export const searchFoodsQuerySchema = z.object({
  q: z.string().optional(),
  category: z
    .enum([
      "protein",
      "carbs",
      "vegetables",
      "fruits",
      "fats",
      "dairy",
      "snacks",
    ])
    .optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const foodSearchQuerySchema = searchFoodsQuerySchema;
