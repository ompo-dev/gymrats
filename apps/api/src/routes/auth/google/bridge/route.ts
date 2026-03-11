import { z } from "zod";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { validateQuery } from "@/lib/api/middleware/validation.middleware";
import { auth } from "@/lib/auth-config";

const bridgeQuerySchema = z.object({
  redirectTo: z.string().url().optional(),
  errorRedirectTo: z.string().url().optional(),
});

function getAppUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    getRequestOrigin(request)
  );
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
  const redirectTo = validation.data.redirectTo || `${appUrl}/auth/callback`;
  const errorRedirectTo =
    validation.data.errorRedirectTo || `${appUrl}/auth/callback?error=true`;

  try {
    const { token } = await auth.api.generateOneTimeToken({
      headers: request.headers,
    });

    const redirectUrl = new URL(redirectTo);
    redirectUrl.searchParams.set("oneTimeToken", token);

    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    console.error("Erro ao criar token de ponte OAuth:", error);

    const errorUrl = new URL(errorRedirectTo);
    errorUrl.searchParams.set("oauth_bridge", "failed");

    return NextResponse.redirect(errorUrl, 302);
  }
}
