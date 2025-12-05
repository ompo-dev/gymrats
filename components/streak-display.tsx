"use client"

import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  className?: string
}

export function StreakDisplay({ currentStreak, longestStreak, className }: StreakDisplayProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-6 text-accent-foreground shadow-lg",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-foreground/20">
          <Flame className="h-8 w-8" />
        </div>
        <div>
          <div className="text-4xl font-bold">{currentStreak}</div>
          <div className="text-sm opacity-90">dias de ofensiva</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-accent-foreground/10 p-3">
        <span className="text-sm">Recorde</span>
        <span className="font-bold">{longestStreak} dias</span>
      </div>
    </div>
  )
}
