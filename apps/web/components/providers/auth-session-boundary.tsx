import type { ReactNode } from "react";
import { readAuthSession } from "@/lib/actions/auth-readers";
import { AuthSessionProvider } from "./auth-session-provider";

export async function AuthSessionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const initialSession = await readAuthSession().catch(() => null);

  return (
    <AuthSessionProvider initialSession={initialSession}>
      {children}
    </AuthSessionProvider>
  );
}
