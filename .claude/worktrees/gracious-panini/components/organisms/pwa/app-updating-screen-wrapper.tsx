"use client";

import { usePWAUpdate } from "@/lib/hooks/use-pwa-update";
import { AppUpdatingScreen } from "./app-updating-screen";

export function AppUpdatingScreenWrapper() {
	const { isUpdating } = usePWAUpdate();
	return <AppUpdatingScreen isVisible={isUpdating} />;
}
