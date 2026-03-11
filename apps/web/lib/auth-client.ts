import { oneTimeTokenClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { resolveApiBaseUrl } from "@/lib/api/client-factory";

export const authClient = createAuthClient({
  baseURL: resolveApiBaseUrl(),
  plugins: [oneTimeTokenClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
