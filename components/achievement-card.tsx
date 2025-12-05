"use client"

import type { Achievement } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"

interface AchievementCardProps {
  achievement: Achievement
  className?: string
}

export function AchievementCard({ achievement, className }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-all",
        isUnlocked ? "border-success bg-success/10 shadow-lg shadow-success/20" : "border-border bg-muted/50",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg text-2xl",
            isUnlocked ? "bg-success/20" : "bg-muted",
          )}
        >
          {isUnlocked ? achievement.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
        </div>

        <div className="flex-1">
          <h4 className={cn("font-bold", !isUnlocked && "text-muted-foreground")}>{achievement.title}</h4>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>

          {isUnlocked && achievement.unlockedAt && (
            <p className="mt-1 text-xs text-success">
              Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
