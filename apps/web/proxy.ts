import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/utils/middleware-auth";
import {
  buildLoginRedirectPath,
  canAccessProtectedRoute,
  getDefaultRouteForRole,
  isAuthEntryRoute,
  isProtectedAppRoute,
} from "@/lib/auth/route-access";

function buildRequestHeaders(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-gymrats-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-gymrats-search", request.nextUrl.search);
  return requestHeaders;
}

function nextWithContext(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: buildRequestHeaders(request),
    },
  });
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = new URL(pathname, request.url);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = isProtectedAppRoute(pathname);
  const isAuthRoute = isAuthEntryRoute(pathname);

  if (!isProtectedRoute && !isAuthRoute) {
    return nextWithContext(request);
  }

  const session = await getAuthSession(request).catch(() => null);
  const role = session?.user?.role ?? null;
  const isAuthenticated = Boolean(session?.user?.id);

  if (pathname === "/auth/login" || pathname === "/welcome") {
    if (isAuthenticated) {
      return redirectTo(request, getDefaultRouteForRole(role));
    }

    return nextWithContext(request);
  }

  if (pathname === "/auth/register/user-type") {
    if (!isAuthenticated) {
      return redirectTo(
        request,
        buildLoginRedirectPath(pathname, request.nextUrl.search),
      );
    }

    if (role !== "PENDING") {
      return redirectTo(request, getDefaultRouteForRole(role));
    }

    return nextWithContext(request);
  }

  if (!isAuthenticated) {
    return redirectTo(
      request,
      buildLoginRedirectPath(pathname, request.nextUrl.search),
    );
  }

  if (!canAccessProtectedRoute(pathname, role)) {
    return redirectTo(request, getDefaultRouteForRole(role));
  }

  return nextWithContext(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
