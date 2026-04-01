import "server-only";

import type { AuthSessionResponse } from "@/lib/api/auth";
import { readCachedApi } from "./cached-reader";

export type AuthSessionPayload = AuthSessionResponse;

export async function readAuthSession(): Promise<AuthSessionPayload> {
  return readCachedApi<AuthSessionPayload>({
    path: "/api/auth/session",
    tags: ["auth:session"],
    profile: "seconds",
    scope: "private",
  });
}
