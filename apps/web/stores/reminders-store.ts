import { create } from "zustand";
import type { ReminderPreferences } from "@/lib/types/reminder-notifications";

interface RemindersState {
  preferences: ReminderPreferences;
  permission: NotificationPermission;

  // Actions
  updatePreferences: (prefs: Partial<ReminderPreferences>) => void;
  setPermission: (permission: NotificationPermission) => void;
}

const defaultPreferences: ReminderPreferences = {
  enabled: false,
  habitReminders: false,
  workoutReminders: true,
  mealReminders: true,
  reminderTimes: {
    workouts: "18:00",
    meals: {
      breakfast: "08:00",
      lunch: "12:00",
      dinner: "19:00",
    },
  },
};

export const useRemindersStore = create<RemindersState>()((set) => ({
  preferences: defaultPreferences,
  permission:
    typeof window !== "undefined" ? Notification.permission : "default",

  updatePreferences: (prefs) => {
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    }));
  },

  setPermission: (permission) => {
    set({ permission });
  },
}));
