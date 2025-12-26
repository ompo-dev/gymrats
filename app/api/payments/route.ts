import { NextRequest } from "next/server";
import { getPaymentsHandler } from "@/lib/api/handlers/payments.handler";

export async function GET(request: NextRequest) {
  return getPaymentsHandler(request);
}
