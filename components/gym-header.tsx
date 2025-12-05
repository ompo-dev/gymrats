"use client"

import { Flame, Trophy, TrendingUp } from "lucide-react"
import { mockGymProfile } from "@/lib/gym-mock-data"

export function GymHeader() {
  const { gamification } = mockGymProfile

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-gray-200 bg-white shadow-sm">
      <div className="flex h-[70px] items-center justify-end gap-2 px-3">
        {/* Level */}
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#FF9600] bg-white px-3 py-1.5">
          <Trophy className="h-4 w-4 fill-[#FF9600] text-[#FF9600]" />
          <span className="text-xs font-bold text-[#FF9600]">Nv {gamification.level}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#1CB0F6] bg-white px-3 py-1.5">
          <div className="h-4 w-4">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L3 7L12 12L21 7L12 2Z"
                fill="#1CB0F6"
                stroke="#1CB0F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 17L12 22L21 17"
                stroke="#1CB0F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 12L12 17L21 12"
                stroke="#1CB0F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xs font-bold text-[#1CB0F6]">{gamification.xp}</span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#FF9600] bg-white px-3 py-1.5">
          <Flame className="h-4 w-4 fill-[#FF9600] text-[#FF9600]" />
          <span className="text-xs font-bold text-[#FF9600]">{gamification.currentStreak}</span>
        </div>

        {/* Ranking */}
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#CE82FF] bg-white px-3 py-1.5">
          <TrendingUp className="h-4 w-4 text-[#CE82FF]" />
          <span className="text-xs font-bold text-[#CE82FF]">#{gamification.ranking}</span>
        </div>
      </div>
    </header>
  )
}
