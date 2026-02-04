import type { NextRequest } from "next/server";
import {
	getDailyNutritionHandler,
	updateDailyNutritionHandler,
} from "@/lib/api/handlers/nutrition.handler";

export async function GET(request: NextRequest) {
	return getDailyNutritionHandler(request);
}

export async function POST(request: NextRequest) {
	return updateDailyNutritionHandler(request);
}

export async function PUT(request: NextRequest) {
	return updateDailyNutritionHandler(request);
}

export async function PATCH(request: NextRequest) {
	return updateDailyNutritionHandler(request);
}
