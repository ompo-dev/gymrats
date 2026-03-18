"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { startTransition, type ReactNode } from "react";
import { AppBottomNav } from "@/components/organisms/navigation/app-bottom-nav";
import { AppHeader } from "@/components/organisms/navigation/app-header";
import { useScrollReset } from "@/hooks/use-scroll-reset";

export interface TabConfig {
  id: string;
  icon: LucideIcon;
  label: string;
}

export interface AppLayoutProps {
  children: ReactNode;
  userType: "student" | "gym" | "personal";
  tabs: TabConfig[];
  defaultTab: string;
  basePath: string;
  stats: {
    streak: number;
    xp: number;
    level?: number;
    ranking?: number;
  };
  showLogo?: boolean;
  onTabChange?: (newTab: string, currentTab: string) => Promise<void> | void;
  additionalContent?: ReactNode;
  scrollResetEnabled?: boolean;
  className?: string;
}

function AppLayoutSimple({
  children,
  userType,
  tabs,
  defaultTab,
  basePath,
  stats,
  showLogo = false,
  onTabChange: customTabChange,
  additionalContent,
  scrollResetEnabled = true,
  className = "",
}: AppLayoutProps) {
  const pathname = usePathname();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault(defaultTab),
  );

  const mainRef = useScrollReset<HTMLElement>({
    dependencies: [pathname, tab],
    behavior: "instant",
    enabled: scrollResetEnabled,
  });

  const activeTab = tab;

  const handleTabChange = async (newTab: string) => {
    if (newTab === activeTab) {
      return;
    }

    if (customTabChange) {
      await customTabChange(newTab, activeTab);
    } else {
      startTransition(() => {
        void setTab(newTab);
      });
    }

    setTimeout(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${className}`}>
      <AppHeader.Simple userType={userType} stats={stats} showLogo={showLogo} />

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto scrollbar-hide pb-20 touch-manipulation"
      >
        {children}
      </main>

      <AppBottomNav.Simple
        userType={userType}
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={handleTabChange}
      />

      {additionalContent}
    </div>
  );
}

export const AppLayout = {
  Simple: AppLayoutSimple,
};
