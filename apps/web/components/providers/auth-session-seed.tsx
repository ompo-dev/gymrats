import { readAuthSession } from "@/lib/actions/auth-readers";
import { AuthSessionSeedClient } from "./auth-session-seed-client";

export async function AuthSessionSeed() {
  const initialSession = await readAuthSession().catch(() => null);

  return <AuthSessionSeedClient initialSession={initialSession} />;
}
