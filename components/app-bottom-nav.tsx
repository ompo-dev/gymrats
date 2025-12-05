"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

interface Tab {
  id: string
  icon: LucideIcon
  label: string
}

interface AppBottomNavProps {
  userType: "student" | "gym"
  activeTab: string
  tabs: Tab[]
  onTabChange: (tab: string) => void
}

export function AppBottomNav({ userType, activeTab, tabs, onTabChange }: AppBottomNavProps) {
  const isGym = userType === "gym"
  const activeColor = isGym ? "#FF9600" : "#1CB0F6"
  const activeBgClass = isGym ? "bg-[#FF9600]/10" : "bg-duo-blue/10"
  const activeTextClass = isGym ? "text-[#FF9600]" : "text-duo-blue"

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-duo-border bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] pointer-events-auto"
    >
      <div className="flex items-center justify-around px-0.5 py-1">
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onTabChange(tab.id)
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 transition-all hover:bg-gray-50 pointer-events-auto",
                isActive && activeBgClass,
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-colors", isActive ? activeTextClass : "text-duo-gray-dark")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {isActive && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("text-[9px] font-bold", activeTextClass)}
                >
                  {tab.label}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
