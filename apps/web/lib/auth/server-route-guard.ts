import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readAuthSession } from "@/lib/actions/auth-readers";
import {
  buildLoginRedirectPath,
  canAccessProtectedRoute,
  getDefaultRouteForRole,
} from "./route-access";

async function getRequestContext(fallbackPathname: string) {
  const requestHeaders = await headers();
  return {
    pathname: requestHeaders.get("x-gymrats-pathname") || fallbackPathname,
    search: requestHeaders.get("x-gymrats-search") || "",
  };
}

export async function requireProtectedRouteAccess(fallbackPathname: string) {
  const { pathname, search } = await getRequestContext(fallbackPathname);
  const session = await readAuthSession().catch(() => null);
  const user = session?.user ?? null;

  if (!user?.id) {
    redirect(buildLoginRedirectPath(pathname, search));
  }

  if (!canAccessProtectedRoute(pathname, user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return session;
}

export async function redirectAuthenticatedUser() {
  const session = await readAuthSession().catch(() => null);
  const user = session?.user ?? null;

  if (!user?.id) {
    return null;
  }

  redirect(getDefaultRouteForRole(user.role));
}
