"use client"

import { LayoutDashboard, Users, Dumbbell, DollarSign, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface GymBottomNavProps {
  activeTab: "dashboard" | "students" | "equipment" | "financial" | "stats" | "settings"
  onTabChange: (tab: "dashboard" | "students" | "equipment" | "financial" | "stats" | "settings") => void
}

export function GymBottomNav({ activeTab, onTabChange }: GymBottomNavProps) {
  const tabs = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "Início" },
    { id: "students" as const, icon: Users, label: "Alunos" },
    { id: "equipment" as const, icon: Dumbbell, label: "Equip." },
    { id: "financial" as const, icon: DollarSign, label: "Finanças" },
    { id: "stats" as const, icon: BarChart3, label: "Stats" },
    { id: "settings" as const, icon: Settings, label: "Config" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-duo-border bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="container flex items-center justify-around px-0.5 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition-all hover:bg-gray-50",
                isActive && "bg-[#FF9600]/10 text-[#FF9600]",
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-colors", isActive ? "text-[#FF9600]" : "text-duo-gray-dark")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {/* Only show label when tab is active */}
              {isActive && (
                <span
                  className={cn(
                    "text-[9px] font-bold transition-colors",
                    isActive ? "text-[#FF9600]" : "text-duo-gray-dark",
                  )}
                >
                  {tab.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
