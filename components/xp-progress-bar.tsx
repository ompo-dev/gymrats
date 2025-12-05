"use client"

import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

interface XPProgressBarProps {
  currentXP: number
  xpToNextLevel: number
  level: number
  className?: string
}

export function XPProgressBar({ currentXP, xpToNextLevel, level, className }: XPProgressBarProps) {
  const totalXPForLevel = currentXP + xpToNextLevel
  const progress = (currentXP / totalXPForLevel) * 100

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          <span className="font-bold">Nível {level}</span>
        </div>
        <span className="text-muted-foreground">
          {currentXP} / {totalXPForLevel} XP
        </span>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-warning to-accent transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  )
}
