"use client"

import { useState, useRef } from "react"

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: UseSwipeOptions = {}) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null)
  const [mouseEnd, setMouseEnd] = useState<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)

  const minSwipeDistance = threshold

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    // Não iniciar swipe se o toque foi em um botão ou link
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('nav')) {
      return
    }
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
    isDragging.current = true
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      isDragging.current = false
      return
    }

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = Math.abs(touchStart.y - touchEnd.y)
    
    // Só considera swipe se o movimento horizontal for maior que o vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (deltaX < 0 && onSwipeRight) {
        onSwipeRight()
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
    isDragging.current = false
  }

  // Mouse handlers (para desktop com drag)
  const onMouseDown = (e: React.MouseEvent) => {
    // Não iniciar swipe se o clique foi em um botão ou link
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a') || target.closest('nav')) {
      return
    }
    setMouseEnd(null)
    setMouseStart({
      x: e.clientX,
      y: e.clientY,
    })
    isDragging.current = true
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && mouseStart !== null) {
      setMouseEnd({
        x: e.clientX,
        y: e.clientY,
      })
    }
  }

  const onMouseUp = () => {
    if (!mouseStart || !mouseEnd) {
      isDragging.current = false
      return
    }

    const deltaX = mouseStart.x - mouseEnd.x
    const deltaY = Math.abs(mouseStart.y - mouseEnd.y)
    
    // Só considera swipe se o movimento horizontal for maior que o vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (deltaX < 0 && onSwipeRight) {
        onSwipeRight()
      }
    }

    setMouseStart(null)
    setMouseEnd(null)
    isDragging.current = false
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  }
}
