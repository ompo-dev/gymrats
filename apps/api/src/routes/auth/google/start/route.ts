import { z } from "zod";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { validateQuery } from "@/lib/api/middleware/validation.middleware";

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

  const payload = {
    provider: "google",
    callbackURL: bridgeUrl.toString(),
    newUserCallbackURL: bridgeUrl.toString(),
    errorCallbackURL: errorRedirectTo,
  };

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Iniciando login com Google...</title>
  </head>
  <body style="font-family: sans-serif; display: grid; min-height: 100vh; place-items: center; margin: 0;">
    <p>Iniciando login com Google...</p>
    <script>
      const payload = ${JSON.stringify(payload).replaceAll("<", "\\u003c")};
      const errorRedirectTo = ${JSON.stringify(errorRedirectTo).replaceAll("<", "\\u003c")};

      fetch("/api/auth/sign-in/social", {
        method: "POST",
        credentials: "include",
        headers: {
          "accept": "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(async (response) => {
          const data = await response.json().catch(() => null);
          if (!response.ok || !data?.url) {
            const errorUrl = new URL(errorRedirectTo);
            if (data?.error) {
              errorUrl.searchParams.set("message", data.error);
            }
            window.location.replace(errorUrl.toString());
            return;
          }

          window.location.replace(data.url);
        })
        .catch(() => {
          const errorUrl = new URL(errorRedirectTo);
          errorUrl.searchParams.set("oauth_start", "failed");
          window.location.replace(errorUrl.toString());
        });
    </script>
    <noscript>
      <p>Ative o JavaScript para continuar com o login.</p>
      <p><a href="${escapeHtml(errorRedirectTo)}">Voltar</a></p>
    </noscript>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
