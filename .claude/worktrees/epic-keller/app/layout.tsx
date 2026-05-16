import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/organisms/error-boundary";
import { PerformanceOptimizer } from "@/components/organisms/performance-optimizer";
import { AppUpdatingScreenWrapper } from "@/components/organisms/pwa/app-updating-screen-wrapper";
import { PWAUpdateBanner } from "@/components/organisms/pwa/pwa-update-banner";
import { QueryProvider } from "@/components/providers/query-provider";
import { PWAProtection } from "./pwa-protection";
import "./globals.css";

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-display",
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
	return (
		<html lang="pt-BR">
			<body
				className={`${dmSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}
				suppressHydrationWarning
			>
				<NuqsAdapter>
					<ErrorBoundary>
						<QueryProvider>
							<PerformanceOptimizer />
							{children}
							<Suspense fallback={null}>
								<AppUpdatingScreenWrapper />
								<PWAUpdateBanner />
							</Suspense>
							<PWAProtection />
							<Analytics />
						</QueryProvider>
					</ErrorBoundary>
				</NuqsAdapter>
			</body>
		</html>
	);
}
