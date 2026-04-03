export type AppAuthRole =
  | "PENDING"
  | "STUDENT"
  | "GYM"
  | "PERSONAL"
  | "ADMIN"
  | null
  | undefined;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedAppRoute(pathname: string) {
  return ["/student", "/gym", "/personal", "/admin"].some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
}

export function isAuthEntryRoute(pathname: string) {
  return (
    pathname === "/welcome" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register/user-type"
  );
}

export function getDefaultRouteForRole(role: AppAuthRole): string {
  if (role === "PENDING") {
    return "/auth/register/user-type";
  }

  if (role === "GYM") {
    return "/gym";
  }

  if (role === "PERSONAL") {
    return "/personal";
  }

  return "/student";
}

export function buildLoginRedirectPath(pathname: string, search = "") {
  const nextValue = `${pathname}${search}`;
  if (!nextValue || nextValue === "/auth/login") {
    return "/auth/login";
  }

  return `/auth/login?next=${encodeURIComponent(nextValue)}`;
}

export function canAccessProtectedRoute(
  pathname: string,
  role: AppAuthRole,
): boolean {
  if (matchesPrefix(pathname, "/admin")) {
    return role === "ADMIN";
  }

  if (matchesPrefix(pathname, "/student")) {
    return (
      role === "STUDENT" ||
      role === "ADMIN" ||
      (role === "PENDING" && matchesPrefix(pathname, "/student/onboarding"))
    );
  }

  if (matchesPrefix(pathname, "/gym")) {
    return (
      role === "GYM" ||
      role === "ADMIN" ||
      (role === "PENDING" && matchesPrefix(pathname, "/gym/onboarding"))
    );
  }

  if (matchesPrefix(pathname, "/personal")) {
    return (
      role === "PERSONAL" ||
      role === "ADMIN" ||
      (role === "PENDING" && matchesPrefix(pathname, "/personal/onboarding"))
    );
  }

  return true;
}
