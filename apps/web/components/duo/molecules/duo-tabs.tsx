"use client";

import { type HTMLAttributes, type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface DuoTab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface DuoTabsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  tabs: DuoTab[];
  defaultTab?: string;
  variant?: "underline" | "pill" | "button";
}

function DuoTabsSimple({
  tabs,
  defaultTab,
  variant = "pill",
  className,
  ...props
}: DuoTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <div
        role="tablist"
        className={cn(
          "flex gap-1",
          variant === "underline" &&
            "gap-0 border-b-2 border-[var(--duo-border)]",
          variant === "pill" && "rounded-xl bg-[var(--duo-bg-elevated)] p-1",
          variant === "button" && "gap-2",
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-bold transition-all duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--duo-primary)]",
              variant === "underline" && [
                "-mb-[2px] rounded-t-lg border-b-2",
                tab.id === activeTab
                  ? "border-[var(--duo-primary)] text-[var(--duo-primary)]"
                  : "border-transparent text-[var(--duo-fg-muted)] hover:text-[var(--duo-fg)]",
              ],
              variant === "pill" && [
                "flex-1 justify-center rounded-lg",
                tab.id === activeTab
                  ? "bg-[var(--duo-primary)] text-white shadow-sm"
                  : "text-[var(--duo-fg-muted)] hover:text-[var(--duo-fg)]",
              ],
              variant === "button" && [
                "rounded-xl border-2",
                tab.id === activeTab
                  ? "border-[var(--duo-primary)] bg-[var(--duo-primary)]/10 text-[var(--duo-primary)]"
                  : "border-[var(--duo-border)] text-[var(--duo-fg-muted)] hover:border-[var(--duo-fg-muted)]",
              ],
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        className="animate-in fade-in slide-in-from-bottom-1 duration-300"
        key={activeTab}
      >
        {activeContent}
      </div>
    </div>
  );
}

export const DuoTabs = {
  Simple: DuoTabsSimple,
};
