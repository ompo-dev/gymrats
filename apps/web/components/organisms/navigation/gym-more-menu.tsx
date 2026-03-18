"use client";

import {
  BarChart3,
  Crown,
  type LucideIcon,
  Palette,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";
import { useUserSession } from "@/hooks/use-user-session";

interface MoreMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: "duo-blue" | "duo-yellow" | "duo-green";
  adminOnly?: boolean;
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
    description: "Perfil, planos e preferências",
    color: "duo-green",
  },
  {
    id: "subscription",
    icon: Crown,
    label: "Assinatura",
    description: "Gerencie sua assinatura",
    color: "duo-green",
  },
  {
    id: "theme-test",
    icon: Palette,
    label: "Teste de Tema",
    description: "Tabs, cards, stats e color picker",
    color: "duo-yellow",
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

  const handleItemClick = async (itemId: string) => {
    if (itemId === "theme-test") return;
    if (itemId === "subscription") {
      await setSubTab("subscription");
      await setTab("financial");
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
            Acesse todas as funcionalidades
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <div className="grid gap-4">
          {visibleMenuItems.map((item, index) => (
            <div key={item.id} className={index > 0 ? "pt-0" : undefined}>
              {item.id === "theme-test" ? (
                <Link href="/gym/theme-test">
                  <NavigationButtonCard
                    icon={item.icon}
                    title={item.label}
                    description={item.description}
                    color={item.color}
                  />
                </Link>
              ) : (
                <NavigationButtonCard
                  icon={item.icon}
                  title={item.label}
                  description={item.description}
                  color={item.color}
                  onClick={() => handleItemClick(item.id)}
                />
              )}
            </div>
          ))}
        </div>
      </SlideIn>
    </div>
  );
}

export const GymMoreMenu = { Simple: GymMoreMenuSimple };
