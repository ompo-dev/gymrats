"use client";

import { BarChart3, Crown, Palette, Settings } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { GymMoreMenuScreen } from "@/components/screens/gym";
import { useUserSession } from "@/hooks/use-user-session";

const moreMenuItems = [
  {
    id: "stats",
    icon: BarChart3,
    label: "Estatísticas",
    description: "Análises detalhadas e relatórios",
    color: "duo-blue" as const,
  },
  {
    id: "settings",
    icon: Settings,
    label: "Configurações",
    description: "Perfil, planos e preferências",
    color: "duo-green" as const,
  },
  {
    id: "subscription",
    icon: Crown,
    label: "Assinatura",
    description: "Gerencie sua assinatura",
    color: "duo-green" as const,
  },
  {
    id: "theme-test",
    icon: Palette,
    label: "Teste de Tema",
    description: "Tabs, cards, stats e color picker",
    color: "duo-yellow" as const,
    adminOnly: true,
  },
];

function GymMoreMenuSimple() {
  const [, setTab] = useQueryState("tab", parseAsString);
  const [, setSubTab] = useQueryState("subTab", parseAsString);
  const { isAdmin, role } = useUserSession();
  const userIsAdmin = isAdmin || role === "ADMIN";

  const visibleMenuItems = moreMenuItems.filter(
    (item) => !item.adminOnly || userIsAdmin,
  );

  return (
    <GymMoreMenuScreen
      items={visibleMenuItems.map((item) => ({
        id: item.id,
        icon: item.icon,
        label: item.label,
        description: item.description,
        color: item.color,
        href: item.id === "theme-test" ? "/gym/theme-test" : undefined,
        onSelect:
          item.id === "theme-test"
            ? undefined
            : async () => {
                if (item.id === "subscription") {
                  await setSubTab("subscription");
                  await setTab("financial");
                  return;
                }

                await setTab(item.id);
              },
      }))}
    />
  );
}

export const GymMoreMenu = { Simple: GymMoreMenuSimple };
