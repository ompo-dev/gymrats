"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

export function DuoThemeProvider({ children }: { children: React.ReactNode }) {
	const getActiveColors = useThemeStore((s) => s.getActiveColors);
	const activePresetId = useThemeStore((s) => s.activePresetId);
	const colorMode = useThemeStore((s) => s.colorMode ?? "light");

	useEffect(() => {
		const colors = getActiveColors();
		const root = document.documentElement;

		// Variáveis --duo-* (consumidas diretamente pelos componentes Duo)
		root.style.setProperty("--duo-primary", colors.primary);
		root.style.setProperty("--duo-primary-dark", colors.primaryDark);
		root.style.setProperty("--duo-primary-light", colors.primaryLight);
		root.style.setProperty("--duo-secondary", colors.secondary);
		root.style.setProperty("--duo-secondary-dark", colors.secondaryDark);
		root.style.setProperty("--duo-accent", colors.accent);
		root.style.setProperty("--duo-accent-dark", colors.accentDark);
		root.style.setProperty("--duo-success", colors.success);
		root.style.setProperty("--duo-success-dark", colors.successDark);
		root.style.setProperty("--duo-warning", colors.warning);
		root.style.setProperty("--duo-warning-dark", colors.warningDark);
		root.style.setProperty("--duo-danger", colors.danger);
		root.style.setProperty("--duo-danger-dark", colors.dangerDark);
		root.style.setProperty("--duo-bg", colors.background);
		root.style.setProperty("--duo-bg-card", colors.backgroundCard);
		root.style.setProperty("--duo-bg-elevated", colors.backgroundElevated);
		root.style.setProperty("--duo-fg", colors.foreground);
		root.style.setProperty("--duo-fg-muted", colors.foregroundMuted);
		root.style.setProperty("--duo-border", colors.border);

		// Tokens shadcn compatíveis (para componentes que usam bg-background, text-foreground, etc.)
		root.style.setProperty("--background", colors.background);
		root.style.setProperty("--foreground", colors.foreground);
		root.style.setProperty("--card", colors.backgroundCard);
		root.style.setProperty("--primary", colors.primary);
		root.style.setProperty("--secondary", colors.backgroundElevated);
		root.style.setProperty("--muted", colors.backgroundElevated);
		root.style.setProperty("--muted-foreground", colors.foregroundMuted);
		root.style.setProperty("--accent", colors.accent);
		root.style.setProperty("--destructive", colors.danger);
		root.style.setProperty("--border", colors.border);
		root.style.setProperty("--input", colors.border);
		root.style.setProperty("--ring", colors.primary);
		root.style.setProperty("--sidebar", colors.background);
		root.style.setProperty("--sidebar-primary", colors.primary);
		root.style.setProperty("--sidebar-accent", colors.backgroundElevated);
		root.style.setProperty("--sidebar-border", colors.border);
	}, [activePresetId, colorMode, getActiveColors]);

	return <>{children}</>;
}
