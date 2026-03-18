import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { LegacyCacheCleanup } from "@/app/legacy-cache-cleanup";
import { DuoThemeProvider } from "@/components/duo/theme-provider";
import { ErrorBoundary } from "@/components/organisms/error-boundary";
import { PerformanceOptimizer } from "@/components/organisms/performance-optimizer";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymRats - Aprenda Musculação de Forma Gamificada",
  description:
    "Domine técnicas de musculação com lições interativas, gamificação e conquistas. O Duolingo da academia.",
  generator: "v0.app",
  keywords: ["musculação", "treino", "fitness", "gamificação", "aprendizado"],
  icons: {
    icon: [
      {
        url: "/icon.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon.svg",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#58c27d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const normalizeUrl = (value?: string) => value?.replace(/\/$/, "") || "";
  const getOrigin = (value?: string) => {
    if (!value) return "";

    try {
      return new URL(value).origin;
    } catch {
      return "";
    }
  };

  const explicitProxyTarget = normalizeUrl(process.env.API_PROXY_TARGET);
  const publicApiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_URL);
  const authUrl = normalizeUrl(process.env.BETTER_AUTH_URL);
  const appOrigin = getOrigin(process.env.NEXT_PUBLIC_APP_URL || authUrl);
  const publicApiOrigin = getOrigin(publicApiUrl);
  const shouldUseSameOriginProxy = Boolean(
    explicitProxyTarget ||
      (publicApiUrl &&
        appOrigin &&
        publicApiOrigin &&
        publicApiOrigin !== appOrigin),
  );
  const runtimeApiBaseUrl = shouldUseSameOriginProxy
    ? "/api"
    : publicApiUrl || authUrl;
  const runtimeApiBaseSource = explicitProxyTarget
    ? "api_proxy_target"
    : shouldUseSameOriginProxy
      ? "next_public_api_url_cross_origin"
      : publicApiUrl
        ? "next_public_api_url"
        : authUrl
          ? "better_auth_url"
          : "none";

  return (
    <html lang="pt-BR" className={nunito.variable}>
      <head>
        {runtimeApiBaseUrl ? <meta name="gymrats-api-base-url" content={runtimeApiBaseUrl} /> : null}
        <meta name="gymrats-api-base-source" content={runtimeApiBaseSource} />
      </head>
      <body
        data-api-base-url={runtimeApiBaseUrl || undefined}
        data-api-base-source={runtimeApiBaseSource}
        className="font-sans antialiased bg-duo-bg text-duo-fg"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__GYMRATS_API_URL__ = ${JSON.stringify(runtimeApiBaseUrl)};`,
          }}
        />
        <NuqsAdapter>
          <ErrorBoundary>
            <DuoThemeProvider>
              <QueryProvider>
                <AuthSessionProvider>
                  <LegacyCacheCleanup />
                  <PerformanceOptimizer />
                  {children}
                  <Analytics />
                </AuthSessionProvider>
              </QueryProvider>
            </DuoThemeProvider>
          </ErrorBoundary>
        </NuqsAdapter>
      </body>
    </html>
  );
}
