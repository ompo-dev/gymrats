/**
 * Use Case: Search Foods
 * Busca alimentos no banco por nome e/ou categoria.
 */

import { db } from "@/lib/db";

export interface SearchFoodsInput {
  q?: string;
  category?: string;
  limit?: number;
}

export async function searchFoodsUseCase(input: SearchFoodsInput) {
  const { q = "", category, limit = 20 } = input;

  const where: {
    name?: { contains: string; mode: "insensitive" };
    category?: string;
  } = {};

  if (q.trim()) where.name = { contains: q.trim(), mode: "insensitive" };
  if (category) where.category = category;

  const foods = await db.foodItem.findMany({
    where,
    take: Math.min(limit, 100),
    orderBy: { name: "asc" },
  });

  return { foods };
}
