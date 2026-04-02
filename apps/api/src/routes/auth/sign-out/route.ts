import { auth } from "@/lib/auth-config";
import { log } from "@/lib/observability";
import { auditLog } from "@/lib/security/audit-log";
import { signOutUseCase } from "@/lib/use-cases/auth";
import { deleteSession } from "@/lib/utils/session";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

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
      await auditLog({
        action: "AUTH:LOGOUT",
        request,
        payload: {
          error: result.error.message,
        },
        result: "FAILURE",
      });

      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    await auditLog({
      action: "AUTH:LOGOUT",
      request,
      result: "SUCCESS",
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("auth_token");
    response.cookies.delete("better-auth.session_token");
    return response;
  } catch (error) {
    log.error("Erro ao fazer logout", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
