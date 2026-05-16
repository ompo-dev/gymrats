import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { signOutUseCase } from "@/lib/use-cases/auth";
import { deleteSession } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
	try {
		const authHeaderValue = request.headers.get("authorization");
		const authHeaderToken = authHeaderValue
			? authHeaderValue.replace(/^Bearer\s+/i, "").trim()
			: null;
		const cookieAuthToken = request.cookies.get("auth_token")?.value || null;
		const cookieBetterAuthToken =
			request.cookies.get("better-auth.session_token")?.value || null;

		const result = await signOutUseCase(
			{
				signOutBetterAuth: (headers) =>
					auth.api.signOut({ headers }).then(() => undefined),
				deleteSession,
			},
			{
				headers: request.headers,
				authHeaderToken,
				cookieAuthToken,
				cookieBetterAuthToken,
			},
		);

		if (!result.ok) {
			return NextResponse.json(
				{ error: result.error.message },
				{ status: result.error.status },
			);
		}

		const response = NextResponse.json({ success: true });
		response.cookies.delete("auth_token");
		response.cookies.delete("better-auth.session_token");
		return response;
	} catch (error: unknown) {
		console.error("Erro ao fazer logout:", error);
		const message =
			error instanceof Error ? error.message : "Erro ao fazer logout";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
