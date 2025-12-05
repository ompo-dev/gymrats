"use client"

import { Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"

interface GymRatsMascotProps {
  className?: string
  size?: "sm" | "md" | "lg"
  animated?: boolean
}

export function GymRatsMascot({ className, size = "md", animated = true }: GymRatsMascotProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        animated && "animate-bounce-subtle",
        className,
      )}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#58CC02] to-[#47A302] shadow-lg" />
        <div className="absolute inset-[2px] rounded-full bg-white" />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Dumbbell className={cn("text-[#58CC02]", size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-12 w-12")} />
        </div>
        <div className="absolute -bottom-1 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full bg-[#58CC02] opacity-60" />
      </div>
    </div>
  )
}

