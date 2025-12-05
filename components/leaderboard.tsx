"use client"

import { mockLeaderboard } from "@/lib/social-data"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export function Leaderboard() {
  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-duo-yellow text-xl">🥇</div>
    if (rank === 2)
      return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-duo-gray-light text-xl">🥈</div>
    if (rank === 3)
      return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-duo-orange/30 text-xl">🥉</div>
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-duo-gray-light text-lg font-bold text-duo-gray-dark">
        {rank}
      </div>
    )
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-duo-green" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-duo-red" />
    return <Minus className="h-4 w-4 text-duo-gray-dark" />
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Ranking Semanal</h1>
        <p className="text-sm text-duo-gray-dark">Compete com seus amigos pelo topo</p>
      </div>

      <div className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-6">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-duo-yellow" />
        <div className="mb-2 text-center text-2xl font-bold text-duo-text">
          {mockLeaderboard.find((e) => e.user.id === "user-me")?.rank}º Lugar
        </div>
        <div className="text-center text-sm text-duo-gray-dark">Sua posição esta semana</div>
      </div>

      <div className="space-y-2">
        {mockLeaderboard.map((entry) => {
          const isCurrentUser = entry.user.id === "user-me"

          return (
            <div
              key={entry.rank}
              className={cn(
                "rounded-2xl border-2 p-4 transition-all",
                isCurrentUser ? "border-duo-blue bg-duo-blue/10 shadow-lg" : "border-duo-gray-border bg-white",
              )}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={cn("font-bold", isCurrentUser ? "text-duo-blue" : "text-duo-text")}>
                      {entry.user.name}
                    </span>
                    {entry.user.isOnline && <div className="h-2 w-2 rounded-full bg-duo-green" title="Online" />}
                  </div>
                  <div className="text-xs text-duo-gray-dark">
                    Nível {entry.user.level} • {entry.user.currentStreak} dias streak
                  </div>
                </div>

                <div className="text-right">
                  <div className="mb-1 text-xl font-bold text-duo-text">{entry.xp}</div>
                  <div className="flex items-center justify-end gap-1 text-xs font-bold text-duo-gray-dark">
                    {getChangeIcon(entry.change)}
                    {Math.abs(entry.change)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
