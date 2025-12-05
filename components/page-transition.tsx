"use client"

import { motion, AnimatePresence } from "motion/react"
import { usePathname, useSearchParams } from "next/navigation"
import { ReactNode, Suspense } from "react"
import { useSwipeDirection } from "@/contexts/swipe-direction"

// Fix: Add missing import

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

function PageTransitionContent({ children, className = "" }: PageTransitionProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { direction } = useSwipeDirection()

  // Criar uma key única baseada em pathname e searchParams
  const tab = searchParams.get("tab")
  const currentKey = tab ? `${pathname}?tab=${tab}` : pathname

  // Determinar direção da animação: left = -1, right = 1
  const animDirection = direction === "left" ? -1 : direction === "right" ? 1 : 1

  return (
    <motion.div
      key={currentKey}
      initial={false}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: 1
      }}
      transition={{
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1], // easeInOutCubic
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <PageTransitionContent className={className}>
        {children}
      </PageTransitionContent>
    </Suspense>
  )
}

