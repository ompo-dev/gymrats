import { db } from "@/lib/db";
import { parse } from "csv-parse/sync";
import fs from "fs";

function mapCategoryToSchema(category: string): string {
  const categoryMap: Record<string, string> = {
    "Cereais e derivados": "carbs",
    "Verduras, hortaliças e derivados": "vegetables",
    "Frutas e derivados": "fruits",
    "Gorduras e óleos": "fats",
    "Pescados e frutos do mar": "protein",
    "Carnes e derivados": "protein",
    "Leite e derivados": "dairy",
    "Ovos e derivados": "protein",
    "Produtos açucarados": "snacks",
    "Leguminosas e derivados": "protein",
    "Nozes e sementes": "fats",
    "Bebidas (alcoólicas e não alcoólicas)": "snacks",
    Miscelâneas: "snacks",
    "Outros alimentos industrializados": "snacks",
    "Alimentos preparados": "snacks",
  };

  return categoryMap[category] || "snacks";
}

function parseValue(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value || value === "NA" || value === "" || value === "null") return 0;

  if (value.includes("e")) {
    return parseFloat(value) || 0;
  }

  return parseFloat(value) || 0;
}

export function parseFoodsFromCSV(csvContent: string): Array<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: string;
  category: string;
}> {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string | number>>;

  const foods: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servingSize: string;
    category: string;
  }> = [];

  for (const record of records) {
    const name = String(record["Descrição dos alimentos"] || "").trim();
    const categoryCSV = String(record["Categoria do alimento"] || "").trim();
    const calories = parseValue(record["Energia..kcal."]);
    const protein = parseValue(record["Proteína..g."]);
    const fats = parseValue(record["Lipídeos..g."]);
    const carbs = parseValue(record["Carboidrato..g."]);

    if (!name || !categoryCSV) {
      console.warn(
        `[parseFoodsFromCSV] Registro ignorado: nome ou categoria ausente`,
        record
      );
      continue;
    }

    const category = mapCategoryToSchema(categoryCSV);
    const servingSize = "100g";

    foods.push({
      name,
      calories: Math.round(calories),
      protein: Math.max(0, protein),
      carbs: Math.max(0, carbs),
      fats: Math.max(0, fats),
      servingSize,
      category,
    });
  }

  return foods;
}

export async function uploadFoodsFromCSV(
  csvFilePath: string,
  options: {
    skipDuplicates?: boolean;
    batchSize?: number;
  } = {}
): Promise<{
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}> {
  const { skipDuplicates = false, batchSize = 100 } = options;

  const csvContent = fs.readFileSync(csvFilePath, "utf-8");
  const foods = parseFoodsFromCSV(csvContent);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);

    for (const food of batch) {
      try {
        const existing = await db.foodItem.findFirst({
          where: { name: food.name },
        });

        if (existing) {
          if (skipDuplicates) {
            skipped++;
            continue;
          }

          await db.foodItem.update({
            where: { id: existing.id },
            data: {
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              servingSize: food.servingSize,
              category: food.category,
            },
          });
          updated++;
        } else {
          await db.foodItem.create({
            data: {
              name: food.name,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              servingSize: food.servingSize,
              category: food.category,
            },
          });
          created++;
        }
      } catch (error: any) {
        console.error(
          `[uploadFoodsFromCSV] Erro ao processar alimento "${food.name}":`,
          error
        );
        errors++;
      }
    }
  }

  return {
    total: foods.length,
    created,
    updated,
    skipped,
    errors,
  };
}

export async function uploadFoodsFromCSVContent(
  csvContent: string,
  options: {
    skipDuplicates?: boolean;
    batchSize?: number;
  } = {}
): Promise<{
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}> {
  const { skipDuplicates = false, batchSize = 100 } = options;

  const foods = parseFoodsFromCSV(csvContent);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);

    for (const food of batch) {
      try {
        const existing = await db.foodItem.findFirst({
          where: { name: food.name },
        });

        if (existing) {
          if (skipDuplicates) {
            skipped++;
            continue;
          }

          await db.foodItem.update({
            where: { id: existing.id },
            data: {
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              servingSize: food.servingSize,
              category: food.category,
            },
          });
          updated++;
        } else {
          await db.foodItem.create({
            data: {
              name: food.name,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fats: food.fats,
              servingSize: food.servingSize,
              category: food.category,
            },
          });
          created++;
        }
      } catch (error: any) {
        console.error(
          `[uploadFoodsFromCSVContent] Erro ao processar alimento "${food.name}":`,
          error
        );
        errors++;
      }
    }
  }

  return {
    total: foods.length,
    created,
    updated,
    skipped,
    errors,
  };
}
