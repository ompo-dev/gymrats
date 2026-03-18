"use client";

import { BarChart3, Crown, type LucideIcon, Settings } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";

interface MoreMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: "duo-blue" | "duo-yellow" | "duo-green";
}

const moreMenuItems: MoreMenuItem[] = [
  {
    id: "stats",
    icon: BarChart3,
    label: "Estatísticas",
    description: "Análises detalhadas e relatórios",
    color: "duo-blue",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Configurações",
    description: "Perfil e modalidades de atendimento",
    color: "duo-green",
  },
  {
    id: "financial",
    icon: Crown,
    label: "Assinatura",
    description: "Plano e pagamento",
    color: "duo-yellow",
  },
];

function PersonalMoreMenuSimple() {
  const [, setTab] = useQueryState("tab", parseAsString);
  const [, setSubTab] = useQueryState("subTab", parseAsString);

  const handleItemClick = async (itemId: string) => {
    if (itemId === "financial") {
      await setSubTab("subscription");
      await setTab("financial");
      return;
    }
    if (itemId === "stats") {
      await setTab("stats");
      return;
    }
    await setTab(itemId);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Mais</h1>
          <p className="text-sm text-duo-gray-dark">
            Configurações e assinatura
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="grid gap-4">
          {moreMenuItems.map((item, index) => (
            <div key={item.id} className={index > 0 ? "pt-0" : undefined}>
              <NavigationButtonCard
                icon={item.icon}
                title={item.label}
                description={item.description}
                color={item.color}
                onClick={() => handleItemClick(item.id)}
              />
            </div>
          ))}
        </div>
      </SlideIn>
    </div>
  );
}

export const PersonalMoreMenu = { Simple: PersonalMoreMenuSimple };
