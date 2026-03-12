"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordClientTelemetryEvent } from "@/lib/observability/client-events";

export function PerformanceOptimizer() {
  const pathname = usePathname();

  useEffect(() => {
    const addPreconnect = (href: string, crossOrigin?: string) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      if (crossOrigin) {
        link.crossOrigin = crossOrigin;
      }
      document.head.appendChild(link);
    };

    const addDnsPrefetch = (href: string) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = href;
      document.head.appendChild(link);
    };

    addPreconnect("https://fonts.googleapis.com", "anonymous");
    addPreconnect("https://fonts.gstatic.com", "anonymous");
    addDnsPrefetch("https://fonts.googleapis.com");
    addDnsPrefetch("https://fonts.gstatic.com");
  }, []);

  useEffect(() => {
    const route = pathname || "/";
    const navigationEntry = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;

    void recordClientTelemetryEvent({
      eventType: "frontend.route_view",
      domain: "web",
      journey: route,
      metricName: "ttfb",
      metricValue: navigationEntry ? Math.round(navigationEntry.responseStart) : 0,
      payload: {
        route,
        requestCount: performance.getEntriesByType("resource").length,
        transferSize: navigationEntry?.transferSize ?? 0,
      },
    });
  }, [pathname]);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") {
      return;
    }

    const observers: PerformanceObserver[] = [];

    const observe = (
      type: string,
      handler: (entries: PerformanceEntry[]) => void,
    ) => {
      if (
        !PerformanceObserver.supportedEntryTypes ||
        !PerformanceObserver.supportedEntryTypes.includes(type)
      ) {
        return;
      }

      const observer = new PerformanceObserver((list) => {
        handler(list.getEntries());
      });
      observer.observe({ type: type as never, buffered: true } as PerformanceObserverInit);
      observers.push(observer);
    };

    observe("largest-contentful-paint", (entries) => {
      const lastEntry = entries[entries.length - 1];
      if (!lastEntry) {
        return;
      }

      void recordClientTelemetryEvent({
        eventType: "frontend.web_vital",
        domain: "web",
        journey: window.location.pathname,
        metricName: "lcp",
        metricValue: Math.round(lastEntry.startTime),
        payload: { route: window.location.pathname },
      });
    });

    observe("layout-shift", (entries) => {
      const value = entries.reduce((total, entry) => {
        const shiftEntry = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };

        if (shiftEntry.hadRecentInput) {
          return total;
        }

        return total + (shiftEntry.value ?? 0);
      }, 0);

      void recordClientTelemetryEvent({
        eventType: "frontend.web_vital",
        domain: "web",
        journey: window.location.pathname,
        metricName: "cls",
        metricValue: Number(value.toFixed(4)),
        payload: { route: window.location.pathname },
      });
    });

    observe("event", (entries) => {
      const inp = entries.reduce((maxDuration, entry) => {
        const eventEntry = entry as PerformanceEntry & {
          duration?: number;
          interactionId?: number;
        };
        if (!eventEntry.interactionId) {
          return maxDuration;
        }
        return Math.max(maxDuration, Math.round(eventEntry.duration ?? 0));
      }, 0);

      if (inp > 0) {
        void recordClientTelemetryEvent({
          eventType: "frontend.web_vital",
          domain: "web",
          journey: window.location.pathname,
          metricName: "inp",
          metricValue: inp,
          payload: { route: window.location.pathname },
        });
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return null;
}
