import type { NextRequest } from "next/server";
import {
	deleteUnitHandler,
	updateUnitHandler,
} from "@/lib/api/handlers/workout-management.handler";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	return updateUnitHandler(request, { params });
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	return deleteUnitHandler(request, { params });
}
