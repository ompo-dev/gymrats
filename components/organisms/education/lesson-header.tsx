"use client"

import { X, Heart } from "lucide-react"

interface LessonHeaderProps {
  progress: number
  lives: number
  onExit: () => void
}

export function LessonHeader({ progress, lives, onExit }: LessonHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="container flex h-16 items-center gap-4 px-4">
        <button onClick={onExit} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted">
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: lives }).map((_, i) => (
            <Heart key={i} className="h-6 w-6 fill-destructive text-destructive" />
          ))}
          {Array.from({ length: 3 - lives }).map((_, i) => (
            <Heart key={`empty-${i}`} className="h-6 w-6 text-muted" />
          ))}
        </div>
      </div>
    </header>
  )
}
