import {
  BarChart3,
  Crown,
  Palette,
  Settings,
} from "lucide-react";
import type { GymMoreMenuScreenProps } from "./gym-more-menu.screen";

export function createGymMoreMenuFixture(
  overrides: Partial<GymMoreMenuScreenProps> = {},
): GymMoreMenuScreenProps {
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
        description: "Perfil, planos e preferências",
        color: "duo-green",
        onSelect: () => undefined,
      },
      {
        id: "subscription",
        icon: Crown,
        label: "Assinatura",
        description: "Gerencie sua assinatura",
        color: "duo-green",
        onSelect: () => undefined,
      },
      {
        id: "theme-test",
        icon: Palette,
        label: "Teste de Tema",
        description: "Tabs, cards, stats e color picker",
        color: "duo-yellow",
        href: "/gym/theme-test",
      },
    ],
    ...overrides,
  };
}
