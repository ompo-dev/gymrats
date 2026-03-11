import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Suspense } from "react";
import { DuoThemeProvider } from "@/components/duo/theme-provider";
import { ErrorBoundary } from "@/components/organisms/error-boundary";
import { PerformanceOptimizer } from "@/components/organisms/performance-optimizer";
import AppUpdatingScreenWrapper from "@/components/organisms/pwa/app-updating-screen-wrapper";
import PWAUpdateBanner from "@/components/organisms/pwa/pwa-update-banner";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { PWAProtection } from "./pwa-protection";
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
  manifest: "/manifest.json",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GymRats",
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
  const runtimeApiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BETTER_AUTH_URL ||
    ""
  ).replace(/\/$/, "");

  return (
    <html lang="pt-BR" className={nunito.variable}>
      <head>
        {runtimeApiBaseUrl ? (
          <meta name="gymrats-api-base-url" content={runtimeApiBaseUrl} />
        ) : null}
      </head>
      <body
        data-api-base-url={runtimeApiBaseUrl || undefined}
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
                  <PerformanceOptimizer />
                  {children}
                  <Suspense fallback={null}>
                    <AppUpdatingScreenWrapper />
                    <PWAUpdateBanner />
                  </Suspense>
                  <PWAProtection />
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
