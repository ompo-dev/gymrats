import type { PersonalSettingsScreenProps } from "./personal-settings.screen";

export function createPersonalSettingsFixture(
  overrides: Partial<PersonalSettingsScreenProps> = {},
): PersonalSettingsScreenProps {
  return {
    form: {
      name: "Rafa Moreira",
      email: "rafa@gymrats.local",
      phone: "(11) 99999-0001",
      bio: "Personal focado em hipertrofia e acompanhamento de longo prazo.",
      address: "Rua dos Atletas, 45 - São Paulo",
      cref: "123456-G/SP",
      pixKeyType: "EMAIL",
      pixKey: "rafa@gymrats.local",
      atendimentoPresencial: true,
      atendimentoRemoto: true,
    },
    hasChanges: false,
    saving: false,
    saveError: "",
    canSwitchToStudent: true,
    onFieldChange: () => undefined,
    onSave: () => undefined,
    onLogout: () => undefined,
    onSwitchToStudent: () => undefined,
    ...overrides,
  };
}
