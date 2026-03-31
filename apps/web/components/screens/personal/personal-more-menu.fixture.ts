import { BarChart3, Crown, Settings } from "lucide-react";
import type { PersonalMoreMenuScreenProps } from "./personal-more-menu.screen";

export function createPersonalMoreMenuFixture(
  overrides: Partial<PersonalMoreMenuScreenProps> = {},
): PersonalMoreMenuScreenProps {
  return {
    items: [
      {
        id: "stats",
        icon: BarChart3,
        label: "Estatísticas",
        description: "Análises detalhadas e relatórios",
        color: "duo-blue",
        onSelect: () => undefined,
      },
      {
        id: "settings",
        icon: Settings,
        label: "Configurações",
        description: "Perfil e modalidades de atendimento",
        color: "duo-green",
        onSelect: () => undefined,
      },
      {
        id: "financial",
        icon: Crown,
        label: "Assinatura",
        description: "Plano e pagamento",
        color: "duo-yellow",
        onSelect: () => undefined,
      },
    ],
    ...overrides,
  };
}
