"use client"

import { Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface DailyGoalCardProps {
  currentXP: number
  goalXP: number
}

export function DailyGoalCard({ currentXP, goalXP }: DailyGoalCardProps) {
  const progress = Math.min((currentXP / goalXP) * 100, 100)
  const isComplete = currentXP >= goalXP

  return (
    <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-duo-yellow/20">
            <Target className="h-6 w-6 text-duo-yellow" />
          </div>
          <div>
            <h3 className="font-bold text-duo-text">Meta Diária</h3>
            <p className="text-xs text-duo-gray-dark">
              {currentXP} / {goalXP} XP
            </p>
          </div>
        </div>
        {isComplete && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-duo-green">
            <span className="text-xl">✓</span>
          </div>
        )}
      </div>

      <div className="duo-progress-bar h-3">
        <div className={cn("duo-progress-fill", isComplete && "bg-duo-yellow")} style={{ width: `${progress}%` }} />
      </div>

      {isComplete && (
        <div className="mt-3 rounded-xl bg-duo-yellow/10 px-3 py-2 text-center">
          <p className="text-xs font-bold text-duo-yellow">Meta diária concluída! 🎉</p>
        </div>
      )}
    </div>
  )
}
