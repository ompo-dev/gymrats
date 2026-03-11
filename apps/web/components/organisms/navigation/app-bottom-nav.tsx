"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { DuoButton } from "@/components/duo";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface AppBottomNavProps {
  userType: "student" | "gym" | "personal";
  activeTab: string;
  tabs: Tab[];
  onTabChange: (tab: string) => void;
}

function AppBottomNavSimple({
  userType,
  activeTab,
  tabs,
  onTabChange,
}: AppBottomNavProps) {
  const isGym = userType === "gym";
  const isPersonal = userType === "personal";
  const _activeColor = isGym ? "#FF9600" : "#1CB0F6";
  const activeBgClass = isGym
    ? "bg-[#FF9600]/10"
    : isPersonal
      ? "bg-duo-primary/10"
      : "bg-duo-blue/10";
  const activeTextClass = isGym
    ? "text-[#FF9600]"
    : isPersonal
      ? "text-duo-primary"
      : "text-duo-blue";

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-duo-border bg-duo-bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.1)] pointer-events-auto"
    >
      <div className="flex items-center justify-around px-0.5 py-1">
        {tabs.map((tab, _index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <DuoButton
              key={tab.id}
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTabChange(tab.id);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 pointer-events-auto min-h-0 border-0",
                isActive && activeBgClass,
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? activeTextClass : "text-duo-gray-dark",
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <span className={cn("text-[9px] font-bold", activeTextClass)}>
                  {tab.label}
                </span>
              )}
            </DuoButton>
          );
        })}
      </div>
    </motion.nav>
  );
}

export const AppBottomNav = {
  Simple: AppBottomNavSimple,
};
