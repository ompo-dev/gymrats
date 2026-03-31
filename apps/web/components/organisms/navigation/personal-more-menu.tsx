"use client";

import { BarChart3, Crown, Settings } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { PersonalMoreMenuScreen } from "@/components/screens/personal";

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
    description: "Perfil e modalidades de atendimento",
    color: "duo-green" as const,
  },
  {
    id: "financial",
    icon: Crown,
    label: "Assinatura",
    description: "Plano e pagamento",
    color: "duo-yellow" as const,
  },
];

function PersonalMoreMenuSimple() {
  const [, setTab] = useQueryState("tab", parseAsString);
  const [, setSubTab] = useQueryState("subTab", parseAsString);

  return (
    <PersonalMoreMenuScreen
      items={moreMenuItems.map((item) => ({
        ...item,
        onSelect: async () => {
          if (item.id === "financial") {
            await setSubTab("subscription");
            await setTab("financial");
            return;
          }

          if (item.id === "stats") {
            await setTab("stats");
            return;
          }

          await setTab(item.id);
        },
      }))}
    />
  );
}

export const PersonalMoreMenu = { Simple: PersonalMoreMenuSimple };
