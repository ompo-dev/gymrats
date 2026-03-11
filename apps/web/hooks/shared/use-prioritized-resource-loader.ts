"use client";

import { useEffect, useRef } from "react";

interface UsePrioritizedResourceLoaderOptions<
  Section extends string,
  Context extends string,
  StoreSnapshot,
> {
  context?: Context;
  sections?: Section[];
  combineWithContext?: boolean;
  onlyPriorities?: boolean;
  pathname: string;
  tab: string | null;
  contextPriorities: Record<Context, readonly Section[]>;
  detectContext: (pathname: string, tab: string | null) => Context;
  loadPrioritized: (sections: Section[], onlyPriorities?: boolean) => Promise<void>;
  getStoreSnapshot?: () => StoreSnapshot;
  hasSectionData?: (section: Section, snapshot: StoreSnapshot) => boolean;
  minTimeBetweenLoadsMs?: number;
}

export function usePrioritizedResourceLoader<
  Section extends string,
  Context extends string,
  StoreSnapshot,
>({
  context,
  sections,
  combineWithContext = false,
  onlyPriorities = true,
  pathname,
  tab,
  contextPriorities,
  detectContext,
  loadPrioritized,
  getStoreSnapshot,
  hasSectionData,
  minTimeBetweenLoadsMs = 5000,
}: UsePrioritizedResourceLoaderOptions<Section, Context, StoreSnapshot>) {
  const hasCalledRef = useRef(false);
  const lastTabRef = useRef<string | null>(null);
  const lastKeyRef = useRef("");
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (lastTabRef.current !== tab) {
      hasCalledRef.current = false;
      lastTabRef.current = tab;
      lastKeyRef.current = "";
      lastLoadTimeRef.current = 0;
      isLoadingRef.current = false;
    }

    const resolvedContext = context ?? detectContext(pathname, tab);
    const contextSections = [...contextPriorities[resolvedContext]];

    let priorities: Section[];
    if (sections?.length) {
      priorities = combineWithContext
        ? [...new Set([...sections, ...contextSections])]
        : [...sections];
    } else {
      priorities = contextSections;
    }

    const now = Date.now();
    const key = priorities.slice().sort().join(",");

    if (isLoadingRef.current) return;
    if (
      hasCalledRef.current &&
      lastKeyRef.current === key &&
      now - lastLoadTimeRef.current < minTimeBetweenLoadsMs
    ) {
      return;
    }

    if (getStoreSnapshot && hasSectionData) {
      const snapshot = getStoreSnapshot();
      const alreadyReady = priorities.every((section) =>
        hasSectionData(section, snapshot),
      );
      if (alreadyReady && now - lastLoadTimeRef.current < minTimeBetweenLoadsMs) {
        return;
      }
    }

    hasCalledRef.current = true;
    lastKeyRef.current = key;
    lastLoadTimeRef.current = now;
    isLoadingRef.current = true;

    loadPrioritized(priorities, onlyPriorities)
      .catch((error) => {
        console.error("[usePrioritizedResourceLoader] erro:", error);
        setTimeout(() => {
          hasCalledRef.current = false;
        }, 10000);
      })
      .finally(() => {
        isLoadingRef.current = false;
      });
  }, [
    context,
    sections,
    combineWithContext,
    onlyPriorities,
    pathname,
    tab,
    contextPriorities,
    detectContext,
    loadPrioritized,
    getStoreSnapshot,
    hasSectionData,
    minTimeBetweenLoadsMs,
  ]);
}
