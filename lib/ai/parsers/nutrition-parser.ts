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

/**
 * Parseia resposta da IA e valida estrutura
 * A IA já retorna dados completos, não precisa mapear para banco
 */
export function parseNutritionResponse(
	response: string,
): ParsedNutritionResponse {
	try {
		// Tentar extrair JSON da resposta
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error("JSON não encontrado na resposta");
		}

		const parsed = JSON.parse(jsonMatch[0]);

		// Validar estrutura
		if (!parsed.foods || !Array.isArray(parsed.foods)) {
			throw new Error("Estrutura de alimentos inválida");
		}

		// Validar e normalizar cada alimento
		const validatedFoods: ParsedFood[] = parsed.foods.map(
			(food: any, index: number) => {
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

				const category =
					food.category &&
					[
						"protein",
						"carbs",
						"vegetables",
						"fruits",
						"fats",
						"dairy",
						"snacks",
					].includes(food.category)
						? food.category
						: "snacks"; // Default

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
			message: parsed.message || "Alimentos processados com sucesso!",
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
