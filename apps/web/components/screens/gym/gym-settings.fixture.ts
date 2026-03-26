import type {
  GymSettingsDaySchedule,
  GymSettingsScreenProps,
} from "./gym-settings.screen";

function createWeekSchedules(): Record<string, GymSettingsDaySchedule> {
  return {
    monday: { open: "06:00", close: "22:00", enabled: true },
    tuesday: { open: "06:00", close: "22:00", enabled: true },
    wednesday: { open: "06:00", close: "22:00", enabled: true },
    thursday: { open: "06:00", close: "22:00", enabled: true },
    friday: { open: "06:00", close: "21:00", enabled: true },
    saturday: { open: "08:00", close: "14:00", enabled: true },
    sunday: { open: "08:00", close: "12:00", enabled: false },
  };
}

export function createGymSettingsFixture(
  overrides: Partial<GymSettingsScreenProps> = {},
): GymSettingsScreenProps {
  return {
    profile: {
      name: "GymRats Paulista",
      plan: "premium",
      email: "contato@gymrats.local",
    },
    info: {
      address: "Av. Paulista, 900 - São Paulo",
      phone: "(11) 4002-8922",
      cnpj: "12.345.678/0001-99",
      pixKeyType: "EMAIL",
      pixKey: "financeiro@gymrats.local",
    },
    daySchedules: createWeekSchedules(),
    hasInfoChanges: false,
    hasScheduleChanges: false,
    saving: false,
    saveError: "",
    canSwitchToStudent: true,
    onInfoChange: () => undefined,
    onDayScheduleChange: () => undefined,
    onSaveInfo: () => undefined,
    onSaveSchedules: () => undefined,
    onLogout: () => undefined,
    onSwitchToStudent: () => undefined,
    ...overrides,
  };
}
