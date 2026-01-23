"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type SwipeDirection = "left" | "right" | null

interface SwipeDirectionContextType {
  direction: SwipeDirection
  setDirection: (direction: SwipeDirection) => void
}

const SwipeDirectionContext = createContext<SwipeDirectionContextType | undefined>(undefined)

export function SwipeDirectionProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<SwipeDirection>(null)

  return (
    <SwipeDirectionContext.Provider value={{ direction, setDirection }}>
      {children}
    </SwipeDirectionContext.Provider>
  )
}

export function useSwipeDirection() {
  const context = useContext(SwipeDirectionContext)
  if (context === undefined) {
    throw new Error("useSwipeDirection must be used within a SwipeDirectionProvider")
  }
  return context
}

