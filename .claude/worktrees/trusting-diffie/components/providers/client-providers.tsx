"use client";

import type React from "react";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/organisms/error-boundary";

interface ClientProvidersProps {
	children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
	// Captura erros globais não tratados
	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			console.error("🚨 Erro global capturado:", {
				message: event.message,
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno,
				error: event.error,
				timestamp: new Date().toISOString(),
				url: window.location.href,
				userAgent: navigator.userAgent,
			});
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			// Ignora erros conhecidos e não críticos
			const reason = event.reason;
			const reasonString = reason?.toString() || "";
			const reasonMessage = reason?.message || "";

			// Ignora erros de WebSocket do HMR (Hot Module Replacement)
			if (
				reasonString.includes("WebSocket") ||
				reasonString.includes("webpack-hmr") ||
				reasonMessage.includes("WebSocket") ||
				reasonMessage.includes("Failed to fetch")
			) {
				return; // Silenciosamente ignora esses erros
			}

			// Ignora erros vazios ou undefined
			if (
				!reason ||
				(typeof reason === "object" && Object.keys(reason).length === 0)
			) {
				return;
			}

			console.error("🚨 Promise rejeitada não tratada:", {
				reason: event.reason,
				timestamp: new Date().toISOString(),
				url: window.location.href,
				userAgent: navigator.userAgent,
			});
		};

		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleUnhandledRejection);

		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener(
				"unhandledrejection",
				handleUnhandledRejection,
			);
		};
	}, []);

	return <ErrorBoundary>{children}</ErrorBoundary>;
}
