"use client";

import { useReminderNotifications } from "@/hooks/use-reminder-notifications";
import { Button } from "@/components/ui/button";

export function RemindersBanner() {
  const { isSupported, permission, isEnabled, requestPermission } = useReminderNotifications();

  if (!isSupported) return null;
  if (permission === "granted" && isEnabled) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Ativar Lembretes
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Receba notificações quando treinos não forem feitos ou refeições não forem registradas.
          </p>
        </div>
        <Button
          onClick={requestPermission}
          variant="default"
          size="sm"
        >
          Ativar
        </Button>
      </div>
    </div>
  );
}

