import * as React from "react"
import { DuoCard } from "./duo-card"
import { StatCard } from "./stat-card"
import { cn } from "@/lib/utils"

export interface ProfileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar?: string | React.ReactNode
  name: string
  username: string
  memberSince: string
  stats: {
    workouts: number
    friends: number
    streak: number
  }
  quickStats: Array<{
    value: string | number
    label: string
    highlighted?: boolean
  }>
}

export function ProfileHeader({
  avatar = "👤",
  name,
  username,
  memberSince,
  stats,
  quickStats,
  className,
  ...props
}: ProfileHeaderProps) {
  return (
    <DuoCard variant="default" size="default" className={cn(className)} {...props}>
      <div className="flex items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-300 bg-gradient-to-br from-duo-blue/10 to-duo-green/10 text-4xl shadow-[0_2px_0_#D1D5DB]">
          {avatar}
        </div>
        <div className="flex-1">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">{name}</h1>
          <p className="mb-3 text-sm text-gray-600">
            {username} • Membro desde {memberSince}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="font-bold text-gray-900">{stats.workouts}</span>
              <span className="text-gray-600"> Treinos</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              <span className="font-bold text-gray-900">{stats.friends}</span>
              <span className="text-gray-600"> Amigos</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              <span className="font-bold text-gray-900">{stats.streak}</span>
              <span className="text-gray-600"> Dias streak</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-3">
        {quickStats.map((stat, index) => (
          <StatCard
            key={index}
            value={stat.value}
            label={stat.label}
            variant={stat.highlighted ? "highlighted" : "default"}
          />
        ))}
      </div>
    </DuoCard>
  )
}
