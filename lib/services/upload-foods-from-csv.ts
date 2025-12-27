/**
 * Serviço para fazer upload de alimentos a partir do CSV da TACO
 * Tabela Brasileira de Composição de Alimentos
 */

import { db } from "@/lib/db";
import { parse } from "csv-parse/sync";
import fs from "fs";

/**
 * Mapeia categorias do CSV TACO para categorias do schema
 */
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

/**
 * Converte valor do CSV para número, tratando "NA" e valores científicos
 */
function parseValue(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value || value === "NA" || value === "" || value === "null") return 0;

  // Trata notação científica (ex: "1e-05")
  if (value.includes("e")) {
    return parseFloat(value) || 0;
  }

  return parseFloat(value) || 0;
}

/**
 * Processa o CSV e retorna array de alimentos formatados
 */
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
    // Extrair dados do CSV
    const name = String(record["Descrição dos alimentos"] || "").trim();
    const categoryCSV = String(record["Categoria do alimento"] || "").trim();
    const calories = parseValue(record["Energia..kcal."]);
    const protein = parseValue(record["Proteína..g."]);
    const fats = parseValue(record["Lipídeos..g."]);
    const carbs = parseValue(record["Carboidrato..g."]);

    // Validar dados obrigatórios
    if (!name || !categoryCSV) {
      console.warn(
        `[parseFoodsFromCSV] Registro ignorado: nome ou categoria ausente`,
        record
      );
      continue;
    }

    // Mapear categoria
    const category = mapCategoryToSchema(categoryCSV);

    // Valores são por 100g na TACO
    const servingSize = "100g";

    foods.push({
      name,
      calories: Math.round(calories), // Calorias são inteiros
      protein: Math.max(0, protein), // Garantir não negativo
      carbs: Math.max(0, carbs),
      fats: Math.max(0, fats),
      servingSize,
      category,
    });
  }

  return foods;
}

/**
 * Faz upload dos alimentos do CSV para o banco de dados
 * @param csvFilePath - Caminho do arquivo CSV
 * @param options - Opções de upload
 */
export async function uploadFoodsFromCSV(
  csvFilePath: string,
  options: {
    skipDuplicates?: boolean; // Se true, não atualiza alimentos existentes
    batchSize?: number; // Tamanho do lote para inserção (default: 100)
  } = {}
): Promise<{
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}> {
  const { skipDuplicates = false, batchSize = 100 } = options;

  // Ler arquivo CSV
  const csvContent = fs.readFileSync(csvFilePath, "utf-8");

  // Parse do CSV
  const foods = parseFoodsFromCSV(csvContent);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Processar em lotes
  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);

    for (const food of batch) {
      try {
        // Verificar se alimento já existe
        const existing = await db.foodItem.findFirst({
          where: { name: food.name },
        });

        if (existing) {
          if (skipDuplicates) {
            skipped++;
            continue;
          }

          // Atualizar alimento existente
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
          // Criar novo alimento
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

/**
 * Faz upload dos alimentos a partir do conteúdo CSV (string)
 * Útil para upload via API
 */
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

  // Parse do CSV
  const foods = parseFoodsFromCSV(csvContent);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Processar em lotes
  for (let i = 0; i < foods.length; i += batchSize) {
    const batch = foods.slice(i, i + batchSize);

    for (const food of batch) {
      try {
        // Verificar se alimento já existe
        const existing = await db.foodItem.findFirst({
          where: { name: food.name },
        });

        if (existing) {
          if (skipDuplicates) {
            skipped++;
            continue;
          }

          // Atualizar alimento existente
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
          // Criar novo alimento
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
