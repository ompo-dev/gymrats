"use client"

import type { UserProgress } from "@/lib/types"
import { Settings, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProfileHeaderProps {
  username: string
  userProgress: UserProgress
}

export function ProfileHeader({ username, userProgress }: ProfileHeaderProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-success p-8 text-primary-foreground shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/20 text-4xl font-bold backdrop-blur">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{username}</h1>
            <p className="text-primary-foreground/80">Nível {userProgress.currentLevel}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-primary-foreground/10 p-4 backdrop-blur">
        <div className="text-center">
          <p className="text-2xl font-bold">{userProgress.lessonsCompleted}</p>
          <p className="text-sm text-primary-foreground/80">Lições</p>
        </div>
        <div className="text-center border-x border-primary-foreground/20">
          <p className="text-2xl font-bold">{userProgress.currentStreak}</p>
          <p className="text-sm text-primary-foreground/80">Dias</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{userProgress.totalXP}</p>
          <p className="text-sm text-primary-foreground/80">XP Total</p>
        </div>
      </div>
    </div>
  )
}
