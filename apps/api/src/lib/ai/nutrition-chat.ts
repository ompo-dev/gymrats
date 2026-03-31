import type { ParsedFood } from "@/lib/ai/parsers/nutrition-parser";

export interface NutritionChatMealReference {
  type: string;
  name: string;
  time?: string | null;
}

export interface NutritionChatSelectedMeal {
  type: string;
  name: string;
}

export interface NutritionChatProfileContext {
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFats?: number | null;
  targetWater?: number | null;
  mealsPerDay?: number | null;
  dietType?: string | null;
  allergies?: string[] | null;
  goals?: string[] | null;
}

function roundNutritionChatNumber(value: number | null | undefined) {
  return Math.round(Number(value ?? 0));
}

const DEFAULT_MEAL_NAMES: Record<string, string> = {
  breakfast: "Cafe da Manha",
  lunch: "Almoco",
  dinner: "Janta",
  snack: "Lanche",
  "afternoon-snack": "Cafe da Tarde",
  "pre-workout": "Pre Treino",
  "post-workout": "Pos Treino",
};

const DEFAULT_MEAL_TIMES: Record<string, string> = {
  breakfast: "08:00",
  lunch: "12:30",
  dinner: "19:30",
  snack: "15:00",
  "afternoon-snack": "16:00",
  "pre-workout": "17:00",
  "post-workout": "18:30",
};

export function isCompleteNutritionPlanRequest(message: string): boolean {
  return /plano|completo|dia todo|todas as refeicoes|todas refeicoes|todas as meals|todas as refei/i.test(
    message,
  );
}

export function parseJsonStringArray(
  value: string | null | undefined,
): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function normalizeNutritionMealType(
  mealType: string | null | undefined,
  fallbackMealType?: string | null,
): string {
  const raw = (mealType || fallbackMealType || "snack").trim().toLowerCase();

  const aliases: Record<string, string> = {
    breakfast: "breakfast",
    "cafe da manha": "breakfast",
    "cafe-da-manha": "breakfast",
    lunch: "lunch",
    almoco: "lunch",
    dinner: "dinner",
    jantar: "dinner",
    snack: "snack",
    lanche: "snack",
    "afternoon-snack": "afternoon-snack",
    "cafe da tarde": "afternoon-snack",
    "pre-workout": "pre-workout",
    "pre treino": "pre-workout",
    "post-workout": "post-workout",
    "pos treino": "post-workout",
  };

  return aliases[raw] || raw || "snack";
}

export function getNutritionMealName(mealType: string): string {
  return DEFAULT_MEAL_NAMES[normalizeNutritionMealType(mealType)] || mealType;
}

export function getNutritionMealTime(mealType: string): string | undefined {
  return DEFAULT_MEAL_TIMES[normalizeNutritionMealType(mealType)];
}

function mealRefKey(meal: { type?: string | null; name?: string | null }) {
  return `${normalizeNutritionMealType(meal.type)}::${meal.name?.trim().toLowerCase() || ""}`;
}

export function mergeNutritionMealReferences(
  ...sources: Array<Array<NutritionChatMealReference> | null | undefined>
): NutritionChatMealReference[] {
  const mergedMeals: NutritionChatMealReference[] = [];

  for (const source of sources) {
    for (const meal of source ?? []) {
      const normalizedMeal: NutritionChatMealReference = {
        type: normalizeNutritionMealType(meal.type),
        name: meal.name?.trim() || getNutritionMealName(meal.type),
        time: meal.time || getNutritionMealTime(meal.type) || null,
      };

      const exactIndex = mergedMeals.findIndex(
        (currentMeal) => mealRefKey(currentMeal) === mealRefKey(normalizedMeal),
      );

      if (exactIndex >= 0) {
        mergedMeals[exactIndex] = {
          ...mergedMeals[exactIndex],
          ...normalizedMeal,
          name: normalizedMeal.name || mergedMeals[exactIndex].name,
          time: normalizedMeal.time || mergedMeals[exactIndex].time,
        };
        continue;
      }

      const sameTypeIndex = mergedMeals.findIndex(
        (currentMeal) =>
          normalizeNutritionMealType(currentMeal.type) === normalizedMeal.type,
      );

      if (sameTypeIndex >= 0) {
        mergedMeals[sameTypeIndex] = {
          ...mergedMeals[sameTypeIndex],
          ...normalizedMeal,
          name: normalizedMeal.name || mergedMeals[sameTypeIndex].name,
          time: normalizedMeal.time || mergedMeals[sameTypeIndex].time,
        };
        continue;
      }

      mergedMeals.push(normalizedMeal);
    }
  }

  return mergedMeals;
}

export function buildNutritionSystemPrompt(params: {
  basePrompt: string;
  profile?: NutritionChatProfileContext | null;
  meals?: NutritionChatMealReference[];
  selectedMeal?: NutritionChatSelectedMeal | null;
  userMessage: string;
}) {
  const { basePrompt, profile, meals = [], selectedMeal, userMessage } = params;
  const studentContext: string[] = [];

  if (profile?.targetCalories != null) {
    studentContext.push(
      `- Meta calorica diaria: ${roundNutritionChatNumber(profile.targetCalories)} kcal`,
    );
  }
  if (profile?.targetProtein != null) {
    studentContext.push(
      `- Meta diaria de proteina: ${roundNutritionChatNumber(profile.targetProtein)} g`,
    );
  }
  if (profile?.targetCarbs != null) {
    studentContext.push(
      `- Meta diaria de carboidratos: ${roundNutritionChatNumber(profile.targetCarbs)} g`,
    );
  }
  if (profile?.targetFats != null) {
    studentContext.push(
      `- Meta diaria de gorduras: ${roundNutritionChatNumber(profile.targetFats)} g`,
    );
  }
  if (profile?.targetWater != null) {
    studentContext.push(
      `- Meta diaria de agua: ${roundNutritionChatNumber(profile.targetWater)} ml`,
    );
  }
  if (profile?.mealsPerDay != null) {
    studentContext.push(
      `- Quantidade esperada de refeicoes por dia: ${profile.mealsPerDay}`,
    );
  }
  if (profile?.dietType) {
    studentContext.push(`- Tipo de dieta preferido: ${profile.dietType}`);
  }
  if ((profile?.allergies?.length ?? 0) > 0) {
    studentContext.push(
      `- Alergias/restricoes: ${(profile?.allergies ?? []).join(", ")}`,
    );
  }
  if ((profile?.goals?.length ?? 0) > 0) {
    studentContext.push(`- Objetivos: ${(profile?.goals ?? []).join(", ")}`);
  }

  let prompt = basePrompt;

  prompt +=
    "\n\nREGRA FORTE DE FORMATACAO: nunca use casas decimais para calorias, proteinas, carboidratos ou gorduras. Sempre arredonde macros e calorias para numeros inteiros em qualquer JSON, card ou mensagem.";

  if (studentContext.length > 0) {
    prompt += `\n\nDADOS FIXOS DO ALUNO (use como fonte de verdade):\n${studentContext.join("\n")}\n\nSe esses dados estiverem presentes, nao peca novamente calorias, proteina, carboidratos, gorduras, agua, preferencia alimentar basica ou quantidade de refeicoes. Use esses dados para executar o pedido.`;
  }

  if (meals.length > 0) {
    const mealsInfo = meals
      .map((meal) => {
        const mealTime = meal.time ? `, ${meal.time}` : "";
        return `- ${meal.name} (${meal.type}${mealTime})`;
      })
      .join("\n");
    prompt += `\n\nREFEICOES EXISTENTES:\n${mealsInfo}`;
  }

  if (meals.length > 0 && isCompleteNutritionPlanRequest(userMessage)) {
    prompt +=
      "\n\nREGRA FORTE PARA ESTE PEDIDO: o usuario quer um plano alimentar completo. Use todas as refeicoes existentes acima e devolva pelo menos um alimento para cada uma delas. Nao omita cafe da tarde, pre treino, pos treino ou qualquer outra refeicao existente.";
  } else if (selectedMeal?.type && selectedMeal.name) {
    prompt += `\n\nREFEICAO PADRAO: "${selectedMeal.name}" (${selectedMeal.type}). Se o usuario nao especificar a refeicao, use mealType: "${normalizeNutritionMealType(selectedMeal.type)}".`;
  }

  return prompt;
}

export function buildNutritionMealProgress(
  foods: ParsedFood[],
  options?: {
    fallbackMealType?: string | null;
    existingMeals?: NutritionChatMealReference[];
  },
) {
  const groupedMeals = new Map<
    string,
    {
      type: string;
      name: string;
      time?: string;
      foods: ParsedFood[];
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFats: number;
    }
  >();

  for (const food of foods) {
    const mealType = normalizeNutritionMealType(
      food.mealType,
      options?.fallbackMealType,
    );
    const existingMeal = options?.existingMeals?.find(
      (meal) => normalizeNutritionMealType(meal.type) === mealType,
    );
    const currentMeal = groupedMeals.get(mealType) ?? {
      type: mealType,
      name: existingMeal?.name || getNutritionMealName(mealType),
      time: existingMeal?.time || getNutritionMealTime(mealType),
      foods: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
    };

    currentMeal.foods.push({
      ...food,
      mealType,
    });
    currentMeal.totalCalories += roundNutritionChatNumber(
      food.calories * food.servings,
    );
    currentMeal.totalProtein += roundNutritionChatNumber(
      food.protein * food.servings,
    );
    currentMeal.totalCarbs += roundNutritionChatNumber(
      food.carbs * food.servings,
    );
    currentMeal.totalFats += roundNutritionChatNumber(
      food.fats * food.servings,
    );
    groupedMeals.set(mealType, currentMeal);
  }

  return Array.from(groupedMeals.values());
}
