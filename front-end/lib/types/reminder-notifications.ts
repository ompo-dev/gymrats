export interface ReminderPreferences {
  enabled: boolean;
  habitReminders: boolean; // Habit app
  workoutReminders: boolean; // GymRats
  mealReminders: boolean; // GymRats
  reminderTimes: {
    habits?: string[]; // ["08:00", "20:00"] - horários para verificar hábitos
    workouts?: string; // "18:00" - horário para lembrar treino
    meals?: {
      breakfast?: string; // "08:00"
      lunch?: string; // "12:00"
      dinner?: string; // "19:00"
    };
  };
}

export interface ReminderNotification {
  id: string;
  title: string;
  body: string;
  url: string;
  tag: string; // Para evitar duplicatas
  timestamp: number;
}

