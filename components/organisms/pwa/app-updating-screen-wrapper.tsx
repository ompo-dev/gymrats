"use client";

import { usePWAUpdate } from "@/hooks/use-pwa-update";
import { AppUpdatingScreen } from "./app-updating-screen";

function AppUpdatingScreenWrapperSimple() {
	const { isUpdating } = usePWAUpdate();
	return <AppUpdatingScreen.Simple isVisible={isUpdating} />;
}

export const AppUpdatingScreenWrapper = {
	Simple: AppUpdatingScreenWrapperSimple,
};
// Compatibilidade: permite <AppUpdatingScreenWrapper /> como componente
export default AppUpdatingScreenWrapperSimple;
