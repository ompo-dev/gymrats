"use client"

import { mockActivities } from "@/lib/social-data"
import { Dumbbell, Award, Flame, TrendingUp } from "lucide-react"

export function SocialFeed() {
  const activities = mockActivities

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "workout":
        return <Dumbbell className="h-8 w-8 text-duo-green" />
      case "achievement":
        return <Award className="h-8 w-8 text-duo-yellow" />
      case "streak":
        return <Flame className="h-8 w-8 text-duo-orange" />
      case "level-up":
        return <TrendingUp className="h-8 w-8 text-duo-blue" />
      default:
        return <Dumbbell className="h-8 w-8 text-duo-gray-dark" />
    }
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}min atrás`
    if (hours < 24) return `${hours}h atrás`
    return `${days}d atrás`
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="rounded-2xl border-2 border-duo-gray-border bg-white p-4">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-duo-gray-light">
              {activity.achievementIcon ? (
                <span className="text-2xl">{activity.achievementIcon}</span>
              ) : (
                getActivityIcon(activity.type)
              )}
            </div>

            <div className="flex-1">
              <div className="mb-1 text-sm text-duo-text">
                <span className="font-bold">{activity.user.name}</span>{" "}
                <span className="text-duo-gray-dark">{activity.description}</span>
              </div>

              {activity.workoutName && (
                <div className="mb-1 text-xs font-bold text-duo-green">{activity.workoutName}</div>
              )}

              <div className="flex items-center gap-3 text-xs text-duo-gray-dark">
                <span>{formatTime(activity.timestamp)}</span>
                {activity.xpEarned && <span className="font-bold text-duo-yellow">+{activity.xpEarned} XP</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
