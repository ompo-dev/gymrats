import {
  getAuthSessionFromHeaders,
  isPublicRoute,
} from "@gymrats/domain/middleware-auth";
import type { NextRequest } from "@/runtime/next-server";
import { getSession } from "./session";

export { isPublicRoute };

export async function getAuthSession(request: NextRequest) {
  return getAuthSessionFromHeaders(request.headers, { getSession });
}
