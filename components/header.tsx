"use client"

import { Flame, Heart } from "lucide-react"
import { mockUserProgress } from "@/lib/mock-data"
import Link from "next/link"
import { useState } from "react"
import { StreakModal } from "./streak-modal"

export function Header() {
  const { currentStreak, totalXP } = mockUserProgress
  const [streakModalOpen, setStreakModalOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-duo-border bg-white">
        <div className="container flex h-[70px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-black tracking-tight text-duo-green">GymRats</div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Streak - Duolingo style */}
            <button
              onClick={() => setStreakModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl border-2 border-duo-orange bg-white px-4 py-2 transition-all hover:bg-orange-50"
            >
              <Flame className="h-5 w-5 fill-duo-orange text-duo-orange" />
              <span className="text-sm font-bold text-duo-orange">{currentStreak}</span>
            </button>

            {/* Gems/XP - Duolingo style */}
            <button className="flex items-center gap-2 rounded-2xl border-2 border-duo-blue bg-white px-4 py-2 transition-all hover:bg-blue-50">
              <div className="h-5 w-5">
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
              <span className="text-sm font-bold text-duo-blue">{totalXP}</span>
            </button>

            {/* Hearts - Duolingo style */}
            <button className="flex items-center gap-2 rounded-2xl border-2 border-duo-red bg-white px-4 py-2 transition-all hover:bg-red-50">
              <Heart className="h-5 w-5 fill-duo-red text-duo-red" />
              <span className="text-sm font-bold text-duo-red">∞</span>
            </button>
          </div>
        </div>
      </header>

      <StreakModal open={streakModalOpen} onClose={() => setStreakModalOpen(false)} currentStreak={currentStreak} />
    </>
  )
}
