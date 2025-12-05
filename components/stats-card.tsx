"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  className?: string
}

export function StatsCard({ title, value, icon: Icon, color = "primary", className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl bg-card p-6 shadow-lg", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        <div className={cn("rounded-lg p-3", `bg-${color}/10`)}>
          <Icon className={cn("h-6 w-6", `text-${color}`)} />
        </div>
      </div>
    </div>
  )
}
