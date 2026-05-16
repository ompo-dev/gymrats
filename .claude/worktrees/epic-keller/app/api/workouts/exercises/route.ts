import type { NextRequest } from "next/server";
import { createExerciseHandler } from "@/lib/api/handlers/workout-management.handler";

export async function POST(request: NextRequest) {
	return createExerciseHandler(request);
}
