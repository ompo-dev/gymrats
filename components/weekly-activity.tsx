"use client"

import { cn } from "@/lib/utils"

interface WeeklyActivityProps {
  weeklyXP: number[]
  className?: string
}

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function WeeklyActivity({ weeklyXP, className }: WeeklyActivityProps) {
  const maxXP = Math.max(...weeklyXP, 1)
  const today = new Date().getDay()

  return (
    <div className={cn("rounded-2xl bg-card p-6 shadow-lg", className)}>
      <h3 className="mb-4 font-bold">Atividade Semanal</h3>

      <div className="flex items-end justify-between gap-2">
        {weeklyXP.map((xp, index) => {
          const height = (xp / maxXP) * 100
          const isToday = index === today
          const hasActivity = xp > 0

          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative w-full">
                <div className="h-24 w-full rounded-lg bg-secondary">
                  <div
                    className={cn(
                      "w-full rounded-lg transition-all duration-300",
                      hasActivity ? "bg-primary" : "bg-muted",
                      isToday && "ring-2 ring-primary ring-offset-2",
                    )}
                    style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                  />
                </div>
              </div>
              <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                {daysOfWeek[index]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
