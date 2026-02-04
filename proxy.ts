import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicRoutes = [
	"/welcome",
	"/api/auth",
	"/onboarding",
	"/auth/login",
	"/auth/callback",
];

function isPublicRoute(pathname: string): boolean {
	return publicRoutes.some((route) => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (isPublicRoute(pathname)) {
		return NextResponse.next();
	}

	// Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
	const authToken = request.cookies.get("auth_token")?.value;
	const betterAuthToken = request.cookies.get(
		"better-auth.session_token",
	)?.value;
	const hasAuth = authToken || betterAuthToken;

	if (
		pathname.startsWith("/student") ||
		pathname.startsWith("/workout") ||
		pathname.startsWith("/lesson")
	) {
		if (!hasAuth) {
			return NextResponse.redirect(new URL("/welcome", request.url));
		}
		return NextResponse.next();
	}

	if (pathname.startsWith("/gym")) {
		if (!hasAuth) {
			return NextResponse.redirect(new URL("/welcome", request.url));
		}
		return NextResponse.next();
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
