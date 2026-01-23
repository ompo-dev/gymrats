"use client";

import { useEffect, useState, useCallback } from "react";
import { useRemindersStore } from "@/stores/reminders-store";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

export function useReminderNotifications() {
  const { preferences, permission, updatePreferences, setPermission, syncToServiceWorker } = useRemindersStore();
  const studentStore = useStudentUnifiedStore();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar suporte
    setIsSupported(
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "Notification" in window
    );
  }, []);

  // Solicitar permissão
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === "granted") {
        // Ativar lembretes por padrão
        updatePreferences({ enabled: true });
        // Sincronizar com Service Worker
        await syncToServiceWorker();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return false;
    }
  }, [isSupported, setPermission, updatePreferences, syncToServiceWorker]);

  // Função para buscar dados do app e sincronizar
  const syncAppData = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) return;

      // Buscar dados do store de student
      // Enviar no formato esperado pelo Service Worker
      const appData = {
        workoutHistory: studentStore.data?.workoutHistory || [],
        dailyNutrition: studentStore.data?.dailyNutrition || null,
        // Também enviar como 'nutrition' para compatibilidade
        nutrition: studentStore.data?.dailyNutrition || null
      };
      
      registration.active.postMessage({
        type: "UPDATE_APP_DATA",
        data: appData
      });
    } catch (error) {
      console.error("Erro ao sincronizar dados com SW:", error);
    }
  }, [studentStore.data]);

  // Sincronizar dados quando mudarem
  useEffect(() => {
    if (preferences.enabled && permission === "granted") {
      syncToServiceWorker();
      syncAppData();
    }
  }, [preferences, permission, syncToServiceWorker, syncAppData]);

  // Sincronizar quando app carregar dados ou quando dados mudarem
  useEffect(() => {
    if (!preferences.enabled || permission !== "granted") return;

    // Sincronizar dados do app com SW quando store mudar
    const interval = setInterval(() => {
      syncAppData();
    }, 5 * 60 * 1000); // A cada 5 minutos

    // Sincronizar imediatamente quando dados mudarem
    syncAppData();

    return () => clearInterval(interval);
  }, [preferences.enabled, permission, syncAppData, studentStore.data?.workoutHistory, studentStore.data?.dailyNutrition]);

  return {
    isSupported,
    permission,
    preferences,
    isEnabled: preferences.enabled && permission === "granted",
    requestPermission,
    updatePreferences,
  };
}

