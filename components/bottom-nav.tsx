"use client"

import { Home, Dumbbell, User, UtensilsCrossed, BookOpen, Heart, Wallet, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "home" | "learn" | "cardio" | "diet" | "education" | "payments" | "gyms" | "profile"
  onTabChange: (tab: "home" | "learn" | "cardio" | "diet" | "education" | "payments" | "gyms" | "profile") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home" as const, icon: Home, label: "Início" },
    { id: "learn" as const, icon: Dumbbell, label: "Treino" },
    { id: "cardio" as const, icon: Heart, label: "Cardio" },
    { id: "diet" as const, icon: UtensilsCrossed, label: "Dieta" },
    { id: "education" as const, icon: BookOpen, label: "Aprender" },
    { id: "gyms" as const, icon: MapPin, label: "Academias" },
    { id: "payments" as const, icon: Wallet, label: "Pagamentos" },
    { id: "profile" as const, icon: User, label: "Perfil" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-duo-border bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around px-0.5 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 transition-all hover:bg-gray-50",
                isActive && "bg-duo-blue/10 text-duo-blue",
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-colors", isActive ? "text-duo-blue" : "text-duo-gray-dark")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && <span className="text-[9px] font-bold text-duo-blue">{tab.label}</span>}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
