import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReminderPreferences } from "@/lib/types/reminder-notifications";

interface RemindersState {
	preferences: ReminderPreferences;
	permission: NotificationPermission;

	// Actions
	updatePreferences: (prefs: Partial<ReminderPreferences>) => void;
	setPermission: (permission: NotificationPermission) => void;
	syncToServiceWorker: () => Promise<void>; // Sincroniza dados com SW
}

const defaultPreferences: ReminderPreferences = {
	enabled: false,
	habitReminders: false, // GymRats não usa
	workoutReminders: true, // GymRats
	mealReminders: true, // GymRats
	reminderTimes: {
		workouts: "18:00", // GymRats
		meals: {
			breakfast: "08:00",
			lunch: "12:00",
			dinner: "19:00",
		},
	},
};

export const useRemindersStore = create<RemindersState>()(
	persist(
		(set, get) => ({
			preferences: defaultPreferences,
			permission:
				typeof window !== "undefined" ? Notification.permission : "default",

			updatePreferences: (prefs) => {
				set((state) => ({
					preferences: { ...state.preferences, ...prefs },
				}));
				// Sincronizar com Service Worker
				get().syncToServiceWorker();
			},

			setPermission: (permission) => {
				set({ permission });
			},

			syncToServiceWorker: async () => {
				if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
					return;
				}

				try {
					const registration = await navigator.serviceWorker.ready;
					if (registration.active) {
						// Enviar preferências para Service Worker
						registration.active.postMessage({
							type: "UPDATE_REMINDER_PREFERENCES",
							preferences: get().preferences,
						});

						// Enviar dados do app para Service Worker
						// (workouts, workoutHistory, nutrition)
						const appData = await getAppDataForSW();
						registration.active.postMessage({
							type: "UPDATE_APP_DATA",
							data: appData,
						});
					}
				} catch (error) {
					console.error("Erro ao sincronizar com Service Worker:", error);
				}
			},
		}),
		{
			name: "reminders-storage",
			partialize: (state) => ({
				preferences: state.preferences,
				permission: state.permission,
			}),
		},
	),
);

// Função auxiliar para buscar dados do app (implementar com store de student)
async function getAppDataForSW() {
	// Esta função será implementada no hook que tem acesso ao store de student
	return {};
}
