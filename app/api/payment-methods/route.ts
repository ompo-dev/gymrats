import type { NextRequest } from "next/server";
import {
	addPaymentMethodHandler,
	getPaymentMethodsHandler,
} from "@/lib/api/handlers/payments.handler";

export async function GET(request: NextRequest) {
	return getPaymentMethodsHandler(request);
}

export async function POST(request: NextRequest) {
	return addPaymentMethodHandler(request);
}
