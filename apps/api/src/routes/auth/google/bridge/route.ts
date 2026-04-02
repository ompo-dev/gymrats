import { z } from "zod";
import { validateQuery } from "@/lib/api/middleware/validation.middleware";
import { auth } from "@/lib/auth-config";
import { log } from "@/lib/observability";
import { resolveSafeRedirectTarget } from "@/lib/security/trusted-redirect";
import { type NextRequest, NextResponse } from "@/runtime/next-server";

const bridgeQuerySchema = z.object({
  redirectTo: z.string().url().optional(),
  errorRedirectTo: z.string().url().optional(),
});

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || getRequestOrigin(request);
}

function getRequestOrigin(request: NextRequest) {
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "");
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.nextUrl.host;

  return `${forwardedProto}://${forwardedHost}`;
}

export async function GET(request: NextRequest) {
  const validation = await validateQuery(request, bridgeQuerySchema);
  if (!validation.success) {
    return validation.response;
  }

  const appUrl = getAppUrl(request);
  const redirectTo = resolveSafeRedirectTarget({
    candidate: validation.data.redirectTo,
    fallback: "/auth/callback",
    appUrl,
    requestOrigin: getRequestOrigin(request),
    trustedOrigins: process.env.TRUSTED_ORIGINS,
  });
  const errorRedirectTo = resolveSafeRedirectTarget({
    candidate: validation.data.errorRedirectTo,
    fallback: "/auth/callback?error=true",
    appUrl,
    requestOrigin: getRequestOrigin(request),
    trustedOrigins: process.env.TRUSTED_ORIGINS,
  });

  try {
    const { token } = await auth.api.generateOneTimeToken({
      headers: request.headers,
    });

    const redirectUrl = new URL(redirectTo);
    redirectUrl.searchParams.set("oneTimeToken", token);

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    log.error("[google.bridge] Failed to create one-time token", {
      error: error instanceof Error ? error.message : String(error),
      redirectTo,
      errorRedirectTo,
      requestOrigin: getRequestOrigin(request),
    });

    const errorUrl = new URL(errorRedirectTo);
    errorUrl.searchParams.set("oauth_bridge", "failed");

    return NextResponse.redirect(errorUrl, 302);
  }
}
