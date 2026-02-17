/**
 * Parser de Respostas da IA para Nutrição
 *
 * A IA retorna dados completos dos alimentos (calorias, macros, etc.)
 * Não precisa mapear para banco de dados - apenas validar e usar
 */

import type { FoodItem } from "@/lib/types";

export interface ParsedFood {
  name: string;
  servings: number;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  category:
    | "protein"
    | "carbs"
    | "vegetables"
    | "fruits"
    | "fats"
    | "dairy"
    | "snacks";
  confidence: number;
}

export interface ParsedNutritionResponse {
  foods: ParsedFood[];
  message: string;
}

/** Estrutura bruta do alimento vindo da IA (não validada) */
interface RawParsedFood {
  name?: string;
  servings?: number;
  mealType?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  servingSize?: string;
  category?: string;
  confidence?: number;
}

/** Resultado da extração progressiva: alimentos extraídos do stream até o momento */
export interface NutritionStreamExtractResult {
  foods: ParsedFood[];
}

function parseRawFoodToParsedFood(food: RawParsedFood): ParsedFood | null {
  if (!food.name || typeof food.name !== "string") return null;
  const servings =
    typeof food.servings === "number" && food.servings > 0 ? food.servings : 1;
  const calories =
    typeof food.calories === "number" && food.calories >= 0 ? food.calories : 0;
  const protein =
    typeof food.protein === "number" && food.protein >= 0 ? food.protein : 0;
  const carbs =
    typeof food.carbs === "number" && food.carbs >= 0 ? food.carbs : 0;
  const fats = typeof food.fats === "number" && food.fats >= 0 ? food.fats : 0;
  const servingSize =
    typeof food.servingSize === "string" && food.servingSize
      ? food.servingSize
      : "100g";
  const category: ParsedFood["category"] =
    food.category &&
    [
      "protein",
      "carbs",
      "vegetables",
      "fruits",
      "fats",
      "dairy",
      "snacks",
      "ultra_processed",
    ].includes(food.category)
      ? food.category === "ultra_processed"
        ? "snacks"
        : (food.category as ParsedFood["category"])
      : "snacks";
  const mealType =
    typeof food.mealType === "string" && food.mealType
      ? food.mealType
      : "snack";
  const confidence =
    typeof food.confidence === "number" &&
    food.confidence >= 0 &&
    food.confidence <= 1
      ? food.confidence
      : 0.8;
  return {
    name: food.name.trim(),
    servings,
    mealType,
    calories,
    protein,
    carbs,
    fats,
    servingSize,
    category,
    confidence,
  };
}

/**
 * Extrai alimentos do stream de forma progressiva.
 * Permite mostrar alimentos aparecendo um a um em tempo real.
 */
export function extractFoodsAndPartialFromStream(
  content: string,
): NutritionStreamExtractResult {
  const foods: ParsedFood[] = [];
  const foodsIdx = content.indexOf('"foods"');
  const mealsIdx = content.indexOf('"meals"');
  const idx = foodsIdx >= 0 ? foodsIdx : mealsIdx;
  if (idx === -1) return { foods };

  const arrStart = content.indexOf("[", idx);
  if (arrStart === -1) return { foods };

  let depth = 1;
  let foodStart = -1;
  let inString = false;
  let isEscaped = false;
  let strChar = '"';

  for (let i = arrStart + 1; i < content.length; i++) {
    const c = content[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (inString) {
      if (c === "\\") isEscaped = true;
      else if (c === strChar) inString = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      strChar = c;
      continue;
    }
    if (c === "[" || c === "{") {
      if (depth === 2 && c === "{") {
        foodStart = i;
      }
      depth++;
    } else if (c === "]" || c === "}") {
      depth--;
      if (depth === 2 && c === "}" && foodStart >= 0) {
        try {
          const raw = JSON.parse(
            content.slice(foodStart, i + 1),
          ) as RawParsedFood;
          const parsed = parseRawFoodToParsedFood(raw);
          if (parsed) {
            foods.push(parsed);
          }
        } catch {
          // ignorar
        }
        foodStart = -1;
      }
    }
  }

  return { foods };
}

/**
 * Tenta reparar JSON truncado (ex.: cortado por max_tokens)
 */
function tryRepairTruncatedJson(str: string): string {
  const trimmed = str.trim();
  const stack: Array<"{" | "["> = [];
  let inDoubleString = false;
  let isEscaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (c === "\\" && inDoubleString) {
      isEscaped = true;
      continue;
    }
    if (!inDoubleString) {
      if (c === "{") stack.push("{");
      else if (c === "[") stack.push("[");
      else if (c === "}") {
        if (stack[stack.length - 1] === "{") stack.pop();
      } else if (c === "]") {
        if (stack[stack.length - 1] === "[") stack.pop();
      } else if (c === '"') inDoubleString = true;
    } else if (c === '"') inDoubleString = false;
  }

  let suffix = "";
  if (inDoubleString) suffix += '"';
  while (stack.length > 0) {
    const open = stack.pop();
    suffix += open === "{" ? "}" : "]";
  }
  return trimmed + suffix;
}

/**
 * Parseia resposta da IA e valida estrutura
 * A IA já retorna dados completos, não precisa mapear para banco
 */
export function parseNutritionResponse(
  response: string,
): ParsedNutritionResponse {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON não encontrado na resposta");
    }

    const jsonStr = jsonMatch[0];
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch (firstError) {
      const repaired = tryRepairTruncatedJson(jsonStr);
      try {
        parsed = JSON.parse(repaired) as Record<string, unknown>;
      } catch {
        throw new Error(
          `JSON inválido ou truncado. Tente novamente. Detalhe: ${
            firstError instanceof Error ? firstError.message : "parse falhou"
          }`,
        );
      }
    }

    // Validar estrutura (IA pode retornar "foods" ou "meals")
    const foodsArray = parsed.foods ?? parsed.meals;
    if (!foodsArray || !Array.isArray(foodsArray)) {
      throw new Error("Estrutura de alimentos inválida");
    }

    // Validar e normalizar cada alimento
    const validatedFoods: ParsedFood[] = (foodsArray as RawParsedFood[]).map(
      (food: RawParsedFood, index: number) => {
        // Validar campos obrigatórios
        if (!food.name || typeof food.name !== "string") {
          throw new Error(`Alimento ${index + 1}: nome inválido`);
        }

        // Valores padrão se não fornecidos
        const servings =
          typeof food.servings === "number" && food.servings > 0
            ? food.servings
            : 1;

        const calories =
          typeof food.calories === "number" && food.calories >= 0
            ? food.calories
            : 0;

        const protein =
          typeof food.protein === "number" && food.protein >= 0
            ? food.protein
            : 0;

        const carbs =
          typeof food.carbs === "number" && food.carbs >= 0 ? food.carbs : 0;

        const fats =
          typeof food.fats === "number" && food.fats >= 0 ? food.fats : 0;

        const servingSize =
          typeof food.servingSize === "string" && food.servingSize
            ? food.servingSize
            : "100g";

        const category: ParsedFood["category"] =
          food.category &&
          [
            "protein",
            "carbs",
            "vegetables",
            "fruits",
            "fats",
            "dairy",
            "snacks",
            "ultra_processed",
          ].includes(food.category)
            ? food.category === "ultra_processed"
              ? "snacks"
              : (food.category as ParsedFood["category"])
            : "snacks";

        const mealType =
          typeof food.mealType === "string" && food.mealType
            ? food.mealType
            : "snack"; // Default

        const confidence =
          typeof food.confidence === "number" &&
          food.confidence >= 0 &&
          food.confidence <= 1
            ? food.confidence
            : 0.8; // Default

        return {
          name: food.name.trim(),
          servings,
          mealType,
          calories,
          protein,
          carbs,
          fats,
          servingSize,
          category,
          confidence,
        };
      },
    );

    return {
      foods: validatedFoods,
      message:
        typeof parsed.message === "string"
          ? parsed.message
          : "Alimentos processados com sucesso!",
    };
  } catch (error) {
    console.error("[parseNutritionResponse] Erro ao parsear:", error);
    throw new Error(
      `Erro ao processar resposta da IA: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    );
  }
}

/**
 * Converte ParsedFood para FoodItem (formato usado no sistema)
 */
export function parsedFoodToFoodItem(
  parsedFood: ParsedFood,
  index: number = 0,
): FoodItem {
  return {
    id: `ai-food-${Date.now()}-${index}`, // ID temporário
    name: parsedFood.name,
    calories: parsedFood.calories,
    protein: parsedFood.protein,
    carbs: parsedFood.carbs,
    fats: parsedFood.fats,
    servingSize: parsedFood.servingSize,
    category: parsedFood.category,
  };
}
