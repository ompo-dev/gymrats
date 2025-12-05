"use client"

import type { MuscleGroup, UserStats } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MuscleGroupProgressProps {
  stats: UserStats
  className?: string
}

const muscleGroupLabels: Record<MuscleGroup, { label: string; color: string }> = {
  peito: { label: "Peito", color: "from-red-500 to-red-600" },
  costas: { label: "Costas", color: "from-blue-500 to-blue-600" },
  pernas: { label: "Pernas", color: "from-green-500 to-green-600" },
  ombros: { label: "Ombros", color: "from-yellow-500 to-yellow-600" },
  bracos: { label: "Braços", color: "from-purple-500 to-purple-600" },
  core: { label: "Core", color: "from-orange-500 to-orange-600" },
  gluteos: { label: "Glúteos", color: "from-pink-500 to-pink-600" },
}

export function MuscleGroupProgress({ stats, className }: MuscleGroupProgressProps) {
  return (
    <div className={cn("rounded-2xl bg-card p-6 shadow-lg", className)}>
      <h3 className="mb-6 text-lg font-bold">Progresso por Grupo Muscular</h3>

      <div className="space-y-4">
        {Object.entries(stats.muscleGroupProgress).map(([muscle, progress]) => {
          const muscleData = muscleGroupLabels[muscle as MuscleGroup]

          return (
            <div key={muscle}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{muscleData.label}</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", muscleData.color)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
