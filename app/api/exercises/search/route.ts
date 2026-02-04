import { type NextRequest, NextResponse } from "next/server";
import { exerciseDatabase } from "@/lib/educational-data";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const query = searchParams.get("q")?.toLowerCase() || "";
	const muscleFilter = searchParams.get("muscle")?.toLowerCase() || "";
	const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
	const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

	// Usar exerciseDatabase REAL em vez de gerar IDs simples
	// Isso garante que os IDs retornados correspondam aos IDs no database educacional
	let filtered = exerciseDatabase.map((ex) => ({
		id: ex.id, // ID REAL do database educacional
		name: ex.name,
		primaryMuscles: ex.primaryMuscles || [],
		secondaryMuscles: ex.secondaryMuscles || [],
		difficulty: ex.difficulty,
		equipment: ex.equipment || [],
	}));

	// Filter by query (buscar no nome)
	if (query) {
		filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(query));
	}

	// Filter by muscle group
	if (muscleFilter) {
		filtered = filtered.filter(
			(ex) =>
				ex.primaryMuscles.some(
					(m: string) => m.toLowerCase() === muscleFilter,
				) ||
				ex.secondaryMuscles.some(
					(m: string) => m.toLowerCase() === muscleFilter,
				),
		);
	}

	// Ordenar por nome
	filtered.sort((a, b) => a.name.localeCompare(b.name));

	const total = filtered.length;
	const paginated = filtered.slice(offset, offset + limit);

	return NextResponse.json({
		exercises: paginated,
		total,
	});
}
