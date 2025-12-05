"use client"

import { Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyGoalProps {
  currentXP: number
  goalXP: number
  className?: string
}

export function DailyGoal({ currentXP, goalXP, className }: DailyGoalProps) {
  const progress = Math.min((currentXP / goalXP) * 100, 100)
  const isComplete = currentXP >= goalXP

  return (
    <div className={cn("rounded-2xl bg-card p-6 shadow-lg", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className={cn("h-5 w-5", isComplete ? "text-success" : "text-primary")} />
          <h3 className="font-bold">Meta Diária</h3>
        </div>
        {isComplete && (
          <div className="rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">Completa!</div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold text-primary">{currentXP}</span>
          <span className="text-sm text-muted-foreground">/ {goalXP} XP</span>
        </div>

        <div className="relative h-4 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isComplete ? "bg-success" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
