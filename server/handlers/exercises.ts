import type { Context } from "elysia";
import { exerciseDatabase } from "@/lib/educational-data";
import { successResponse } from "../utils/response";

const EXERCISE_SEARCH_LIMIT = 50;

function coerceInt(val: string | undefined, defaultVal: number): number {
	if (val == null) return defaultVal;
	const n = Number.parseInt(val, 10);
	return Number.isNaN(n)
		? defaultVal
		: Math.min(Math.max(n, 0), EXERCISE_SEARCH_LIMIT);
}

export async function searchExercisesHandler({
	set,
	query,
}: {
	set: Context["set"];
	query?: Record<string, string | undefined>;
}) {
	const q = (query?.q ?? "").toLowerCase().trim();
	const muscle = (query?.muscle ?? "").toLowerCase().trim();
	const limit = coerceInt(query?.limit, 20);
	const offset = coerceInt(query?.offset, 0);

	let filtered = exerciseDatabase.map((ex) => ({
		id: ex.id,
		name: ex.name,
		primaryMuscles: ex.primaryMuscles ?? [],
		secondaryMuscles: ex.secondaryMuscles ?? [],
		difficulty: ex.difficulty,
		equipment: ex.equipment ?? [],
	}));

	if (q) {
		filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(q));
	}
	if (muscle) {
		const hasMuscle = (arr: string[]) =>
			arr.some((m) => m.toLowerCase() === muscle);
		filtered = filtered.filter(
			(ex) => hasMuscle(ex.primaryMuscles) || hasMuscle(ex.secondaryMuscles),
		);
	}

	filtered.sort((a, b) => a.name.localeCompare(b.name));

	const total = filtered.length;
	const exercises = filtered.slice(offset, offset + limit);

	return successResponse(set, { exercises, total });
}
