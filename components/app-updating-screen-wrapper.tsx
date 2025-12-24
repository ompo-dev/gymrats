"use client";

import { AppUpdatingScreen } from "./app-updating-screen";
import { usePWAUpdate } from "@/lib/hooks/use-pwa-update";

export function AppUpdatingScreenWrapper() {
  const { isUpdating } = usePWAUpdate();
  return <AppUpdatingScreen isVisible={isUpdating} />;
}

