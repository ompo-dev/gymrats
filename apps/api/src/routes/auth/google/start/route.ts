import { z } from "zod";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { validateQuery } from "@/lib/api/middleware/validation.middleware";
import { auth } from "@/lib/auth-config";

const startQuerySchema = z.object({
  redirectTo: z.string().url().optional(),
  errorRedirectTo: z.string().url().optional(),
});

function getAppUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  );
}

function getApiOrigin(request: NextRequest) {
  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}

function forwardSetCookies(source: Headers, target: Headers) {
  const maybeGetSetCookie = source as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof maybeGetSetCookie.getSetCookie === "function") {
    for (const cookie of maybeGetSetCookie.getSetCookie()) {
      target.append("Set-Cookie", cookie);
    }
    return;
  }

  const setCookie = source.get("set-cookie");
  if (setCookie) {
    target.append("Set-Cookie", setCookie);
  }
}

export async function GET(request: NextRequest) {
  const validation = await validateQuery(request, startQuerySchema);
  if (!validation.success) {
    return validation.response;
  }

  const appUrl = getAppUrl(request);
  const apiOrigin = getApiOrigin(request);
  const redirectTo = validation.data.redirectTo || `${appUrl}/auth/callback`;
  const errorRedirectTo =
    validation.data.errorRedirectTo || `${appUrl}/auth/callback?error=true`;

  const bridgeUrl = new URL("/api/auth/google/bridge", apiOrigin);
  bridgeUrl.searchParams.set("redirectTo", redirectTo);
  bridgeUrl.searchParams.set("errorRedirectTo", errorRedirectTo);

  try {
    const authRequest = new Request(`${apiOrigin}/api/auth/sign-in/social`, {
      method: "POST",
      headers: new Headers({
        accept: "application/json",
        "content-type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
        "user-agent": request.headers.get("user-agent") ?? "",
      }),
      body: JSON.stringify({
        provider: "google",
        callbackURL: bridgeUrl.toString(),
        newUserCallbackURL: bridgeUrl.toString(),
        errorCallbackURL: errorRedirectTo,
      }),
    });

    const authResponse = await auth(authRequest);
    const payload = (await authResponse
      .clone()
      .json()
      .catch(() => null)) as { error?: string; url?: string } | null;

    if (!authResponse.ok || !payload?.url) {
      const errorUrl = new URL(errorRedirectTo);

      if (payload?.error) {
        errorUrl.searchParams.set("message", payload.error);
      }

      const response = NextResponse.redirect(errorUrl, 302);
      forwardSetCookies(authResponse.headers, response.headers);
      return response;
    }

    const response = NextResponse.redirect(payload.url, 302);
    forwardSetCookies(authResponse.headers, response.headers);
    return response;
  } catch (error) {
    console.error("Erro ao iniciar login com Google:", error);

    const errorUrl = new URL(errorRedirectTo);
    errorUrl.searchParams.set("oauth_start", "failed");

    return NextResponse.redirect(errorUrl, 302);
  }
}
