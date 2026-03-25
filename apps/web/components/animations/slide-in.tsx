"use client";

import type { ReactNode } from "react";

interface SlideInProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction: _direction = "up",
  delay: _delay = 0,
  duration: _duration = 0.4,
  className = "",
}: SlideInProps) {
  return (
    <div className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}
