import { useEffect, useRef, RefObject } from "react";

interface UseScrollResetOptions {
  dependencies?: unknown[];
  behavior?: ScrollBehavior;
  enabled?: boolean;
}

export function useScrollReset<T extends HTMLElement = HTMLElement>(
  options: UseScrollResetOptions = {}
): RefObject<T | null> {
  const { dependencies = [], behavior = "instant", enabled = true } = options;
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    elementRef.current.scrollTo({ top: 0, behavior });
  }, dependencies);

  return elementRef;
}
