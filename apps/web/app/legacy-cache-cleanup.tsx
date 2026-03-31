"use client";

import { useEffect } from "react";

const CLEANUP_VERSION = "pwa-removal-2026-03-11";
const CLEANUP_STORAGE_KEY = `gymrats:${CLEANUP_VERSION}:done`;
const CLEANUP_RELOAD_KEY = `gymrats:${CLEANUP_VERSION}:reloaded`;

export function LegacyCacheCleanup() {
  useEffect(() => {
    let cancelled = false;

    async function runCleanup() {
      if (typeof window === "undefined") {
        return;
      }

      try {
        if (window.localStorage.getItem(CLEANUP_STORAGE_KEY) === "1") {
          return;
        }
      } catch {
        return;
      }

      let hadLegacyArtifacts = false;

      if ("serviceWorker" in navigator) {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();

          if (registrations.length > 0) {
            hadLegacyArtifacts = true;
            await Promise.all(
              registrations.map((registration) => registration.unregister()),
            );
          }
        } catch {
          // Best-effort cleanup only.
        }
      }

      if ("caches" in window) {
        try {
          const cacheKeys = await caches.keys();

          if (cacheKeys.length > 0) {
            hadLegacyArtifacts = true;
            await Promise.all(
              cacheKeys.map((cacheKey) => caches.delete(cacheKey)),
            );
          }
        } catch {
          // Best-effort cleanup only.
        }
      }

      if (cancelled) {
        return;
      }

      try {
        window.localStorage.setItem(CLEANUP_STORAGE_KEY, "1");
      } catch {
        return;
      }

      if (!hadLegacyArtifacts) {
        return;
      }

      try {
        if (window.sessionStorage.getItem(CLEANUP_RELOAD_KEY) === "1") {
          return;
        }

        window.sessionStorage.setItem(CLEANUP_RELOAD_KEY, "1");
        window.location.reload();
      } catch {
        // Ignore reload guard failures.
      }
    }

    void runCleanup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
