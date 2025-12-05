"use client"

import type { Achievement, UserProgress } from "@/lib/types"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AchievementsPageProps {
  achievements: Achievement[]
  userProgress: UserProgress
}

export function AchievementsPage({ achievements, userProgress }: AchievementsPageProps) {
  const unlockedIds = new Set(userProgress.achievements.map((a) => a.id))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Conquistas</h1>
        <p className="text-sm text-duo-gray-dark">
          {unlockedIds.size} de {achievements.length} desbloqueadas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id)

          return (
            <div
              key={achievement.id}
              className={cn(
                "rounded-2xl border-2 p-6 transition-all",
                isUnlocked
                  ? "border-transparent bg-gradient-to-br from-duo-yellow/20 to-duo-green/20 shadow-md"
                  : "border-duo-border bg-gray-50",
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl text-3xl",
                    isUnlocked ? "bg-white shadow-md" : "bg-duo-gray",
                  )}
                  style={{ backgroundColor: isUnlocked ? achievement.color : undefined }}
                >
                  {isUnlocked ? achievement.icon : <Lock className="h-8 w-8 text-duo-gray-dark" />}
                </div>
                {achievement.level && (
                  <div className="rounded-full bg-duo-purple px-3 py-1 text-xs font-bold text-white">
                    Nível {achievement.level}
                  </div>
                )}
              </div>

              <h3 className={cn("mb-1 font-bold", isUnlocked ? "text-duo-text" : "text-duo-gray-dark")}>
                {achievement.title}
              </h3>
              <p className="text-sm text-duo-gray-dark">{achievement.description}</p>

              {/* Progress bar for in-progress achievements */}
              {achievement.progress !== undefined && achievement.target && (
                <div className="mt-3">
                  <div className="duo-progress-bar">
                    <div
                      className="duo-progress-fill"
                      style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-bold text-duo-gray-dark">
                    {achievement.progress}/{achievement.target}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
