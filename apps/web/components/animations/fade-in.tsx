"use client";

import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay: _delay = 0,
  duration: _duration = 0.4,
  className = "",
}: FadeInProps) {
  return (
    <div className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}
