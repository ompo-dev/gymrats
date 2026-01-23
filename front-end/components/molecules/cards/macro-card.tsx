import * as React from "react"
import { DuoCard } from "./duo-card"
import { cn } from "@/lib/utils"

export interface MacroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  current: number
  target: number
  unit: string
  color: "duo-orange" | "duo-red" | "duo-blue" | "duo-yellow" | "duo-green" | "duo-purple"
  progress: number
}

const colorMap = {
  "duo-orange": "bg-duo-orange",
  "duo-red": "bg-duo-red",
  "duo-blue": "bg-duo-blue",
  "duo-yellow": "bg-duo-yellow",
  "duo-green": "bg-duo-green",
  "duo-purple": "bg-duo-purple",
}

export function MacroCard({
  label,
  current,
  target,
  unit,
  color,
  progress,
  className,
  ...props
}: MacroCardProps) {
  // Arredonda valores para exibição mais limpa
  const displayCurrent = unit === "kcal" ? Math.round(current) : Math.round(current * 10) / 10
  const hasExcess = current > target
  const excess = hasExcess ? (unit === "kcal" ? Math.round(current - target) : Math.round((current - target) * 10) / 10) : 0
  
  return (
    <DuoCard variant="default" size="sm" className={cn(className)} {...props}>
      <div className="mb-2 text-xs font-bold uppercase text-duo-gray-dark">{label}</div>
      <div className="mb-2 flex items-center justify-between text-2xl font-bold text-duo-text">
        <span>
          {displayCurrent}
          <span className="text-base text-duo-gray-dark">/{target}</span>
        </span>
        {hasExcess && (
          <span className="text-sm font-bold text-duo-red">
            +{excess} {unit}
          </span>
        )}
      </div>
      <div className="mb-1 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorMap[color])}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="text-xs font-bold text-duo-gray-dark">{unit}</div>
    </DuoCard>
  )
}
