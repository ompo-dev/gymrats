"use client"

import { Trophy, TrendingUp, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaderboardEntry {
  rank: number
  username: string
  xp: number
  isCurrentUser?: boolean
}

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[]
  className?: string
}

export function LeaderboardPreview({ entries, className }: LeaderboardPreviewProps) {
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground">{rank}</span>
  }

  return (
    <div className={cn("rounded-2xl bg-card p-6 shadow-lg", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          <h3 className="font-bold">Ranking Semanal</h3>
        </div>
        <TrendingUp className="h-5 w-5 text-success" />
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "flex items-center justify-between rounded-lg p-3",
              entry.isCurrentUser ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/50",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center">{getMedalIcon(entry.rank)}</div>
              <span className={cn("font-medium", entry.isCurrentUser && "text-primary")}>{entry.username}</span>
            </div>
            <span className="font-bold">{entry.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  )
}
