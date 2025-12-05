"use client"

import type { Achievement } from "@/lib/types"
import { AchievementCard } from "./achievement-card"

interface AchievementsGridProps {
  achievements: Achievement[]
  unlockedCount: number
  className?: string
}

export function AchievementsGrid({ achievements, unlockedCount, className }: AchievementsGridProps) {
  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Conquistas Recentes</h3>
        <span className="text-sm text-muted-foreground">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {achievements.slice(0, 4).map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  )
}
