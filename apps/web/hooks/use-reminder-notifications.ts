"use client";

import { useCallback, useEffect, useState } from "react";
import { useRemindersStore } from "@/stores/reminders-store";

export function useReminderNotifications() {
  const { preferences, permission, updatePreferences, setPermission } =
    useRemindersStore();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "Notification" in window,
    );
  }, []);

  // Solicitar permissão
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        updatePreferences({ enabled: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return false;
    }
  }, [isSupported, setPermission, updatePreferences]);

  return {
    isSupported,
    permission,
    preferences,
    isEnabled: preferences.enabled && permission === "granted",
    requestPermission,
    updatePreferences,
  };
}
