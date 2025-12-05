"use client"

import type { Lesson } from "@/lib/types"
import { Lock, Star, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface LessonNodeProps {
  lesson: Lesson
  position: "left" | "center" | "right"
  onSelect: (lesson: Lesson) => void
}

export function LessonNode({ lesson, position, onSelect }: LessonNodeProps) {
  const isLocked = lesson.locked
  const isCompleted = lesson.completed

  const positionStyles = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  }

  return (
    <button
      onClick={() => !isLocked && onSelect(lesson)}
      disabled={isLocked}
      className={cn(
        "group relative flex flex-col items-center transition-all duration-200",
        positionStyles[position],
        !isLocked && "hover:scale-110 cursor-pointer",
        isLocked && "cursor-not-allowed opacity-60",
      )}
    >
      {/* Lesson Circle */}
      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full border-4 transition-all",
          isCompleted && "border-success bg-success shadow-lg shadow-success/30",
          !isCompleted && !isLocked && "border-muted-foreground bg-card hover:border-primary",
          isLocked && "border-muted bg-muted",
        )}
      >
        {/* Icon */}
        {isLocked ? (
          <Lock className="h-8 w-8 text-muted-foreground" />
        ) : isCompleted ? (
          <Check className="h-8 w-8 text-success-foreground" />
        ) : (
          <span className="text-3xl">{lesson.icon}</span>
        )}

        {/* Stars (if completed) */}
        {isCompleted && lesson.stars && (
          <div className="absolute -bottom-2 flex gap-0.5 rounded-full bg-card px-2 py-0.5 shadow-md">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-3 w-3", i < lesson.stars! ? "fill-warning text-warning" : "fill-muted text-muted")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lesson Title */}
      <div className="mt-2 max-w-[140px] text-center">
        <p className="text-sm font-bold leading-tight">{lesson.title}</p>
        {!isLocked && <p className="text-xs text-muted-foreground">{lesson.estimatedTime} min</p>}
      </div>
    </button>
  )
}
