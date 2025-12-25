import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const foodId = params.id;

    let food = null;
    try {
      food = await db.foodItem.findUnique({
        where: { id: foodId },
      });
    } catch (error: any) {
      // Se a tabela não existir, retornar erro 404
      if (
        error.code === "P2021" ||
        error.message?.includes("does not exist")
      ) {
        console.log(
          "Tabela food_items não existe ainda. Execute: node scripts/apply-nutrition-migration.js"
        );
        return NextResponse.json(
          { error: "Alimento não encontrado" },
          { status: 404 }
        );
      }
      throw error;
    }

    if (!food) {
      return NextResponse.json(
        { error: "Alimento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error("Erro ao buscar alimento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar alimento" },
      { status: 500 }
    );
  }
}

