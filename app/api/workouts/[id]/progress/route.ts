import type { NextRequest } from "next/server";
import {
	deleteWorkoutProgressHandler,
	getWorkoutProgressHandler,
	saveWorkoutProgressHandler,
} from "@/lib/api/handlers/workouts.handler";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } },
) {
	const resolvedParams = await Promise.resolve(params);
	return saveWorkoutProgressHandler(request, resolvedParams.id);
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } },
) {
	const resolvedParams = await Promise.resolve(params);
	return getWorkoutProgressHandler(request, resolvedParams.id);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> | { id: string } },
) {
	const resolvedParams = await Promise.resolve(params);
	return deleteWorkoutProgressHandler(request, resolvedParams.id);
}
