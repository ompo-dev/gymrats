import {
  addPaymentMethodHandler,
  getPaymentMethodsHandler,
} from "@/lib/api/handlers/payments.handler";
import type { NextRequest } from "@/runtime/next-server";

export async function GET(request: NextRequest) {
  return getPaymentMethodsHandler(request);
}

export async function POST(request: NextRequest) {
  return addPaymentMethodHandler(request);
}
