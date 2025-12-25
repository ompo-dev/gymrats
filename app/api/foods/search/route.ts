import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Construir filtros
    const where: any = {};

    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive",
      };
    }

    if (category) {
      where.category = category;
    }

    // Buscar alimentos
    let foods = [];
    try {
      foods = await db.foodItem.findMany({
        where: where,
        take: limit,
        orderBy: {
          name: "asc",
        },
      });
    } catch (error: any) {
      // Se a tabela não existir, retornar array vazio
      if (
        error.code === "P2021" ||
        error.message?.includes("does not exist")
      ) {
        console.log(
          "Tabela food_items não existe ainda. Retornando array vazio. Execute: node scripts/apply-nutrition-migration.js"
        );
        return NextResponse.json({ foods: [] });
      }
      throw error;
    }

    // Transformar para formato esperado
    const formattedFoods = foods.map((food) => ({
      id: food.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
      category: food.category as
        | "protein"
        | "carbs"
        | "vegetables"
        | "fruits"
        | "fats"
        | "dairy"
        | "snacks",
      image: food.image || undefined,
    }));

    return NextResponse.json({ foods: formattedFoods });
  } catch (error: any) {
    console.error("Erro ao buscar alimentos:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar alimentos" },
      { status: 500 }
    );
  }
}

