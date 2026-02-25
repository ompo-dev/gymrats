"use client";

import { Flame, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { StreakModal } from "../modals/streak-modal";
import { GymSelector } from "./gym-selector";

interface AppHeaderProps {
  userType: "student" | "gym";
  stats: {
    streak: number;
    xp: number;
    level?: number;
    ranking?: number;
  };
  showLogo?: boolean;
}

export function AppHeader({
  userType,
  stats,
  showLogo = true,
}: AppHeaderProps) {
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const isGym = userType === "gym";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-white",
          isGym
            ? "border-b-2 border-gray-200 shadow-sm"
            : "border-b border-duo-border",
        )}
      >
        <div
          className={cn(
            "flex h-[70px] items-center px-4 container justify-between",
          )}
        >
          <div className="flex items-center gap-3 w-full">
            {/* Logo apenas para students, Seletor para gyms */}
            {isGym ? (
              <GymSelector />
            ) : (
              showLogo && (
                <Link href="/student" className="flex items-center gap-2">
                  <div className="text-2xl font-black tracking-tight text-duo-green">
                    GymRats
                  </div>
                </Link>
              )
            )}
          </div>

          <div className={cn("flex items-center", isGym ? "gap-2" : "gap-3")}>
            {/* Streak only for students */}
            {!isGym && (
              <button
                onClick={() => setStreakModalOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border-2 bg-white transition-all",
                  isGym
                    ? "border-[#FF9600] px-3 py-1.5 hover:bg-orange-50"
                    : "border-duo-orange px-4 py-2 hover:bg-orange-50",
                )}
              >
                <Flame
                  className={cn(
                    isGym ? "h-4 w-4" : "h-5 w-5",
                    "fill-duo-orange text-duo-orange",
                  )}
                />
                <span
                  className={cn(
                    "font-bold text-duo-orange",
                    isGym ? "text-xs" : "text-sm",
                  )}
                >
                  {stats.streak}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {!isGym && (
        <StreakModal
          open={streakModalOpen}
          onClose={() => setStreakModalOpen(false)}
          currentStreak={stats.streak}
        />
      )}
    </>
  );
}
