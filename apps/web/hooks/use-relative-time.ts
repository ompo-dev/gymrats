"use client";

import { useEffect, useState } from "react";
import { getTimeMs } from "@/lib/utils/date-safe";

export function useRelativeTime(timestamp: Date | string | number) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  const tsMs = getTimeMs(timestamp);

  const calculateTimeAgo = (baseTime: number) => {
    if (tsMs == null) return "—";
    const diff = baseTime - tsMs;
    if (diff < 0) return "agora";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes}m atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${Math.floor(hours / 24)}d atrás`;
    }
  };

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setTimeAgo(calculateTimeAgo(Date.now()));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [calculateTimeAgo]);

  return { timeAgo, mounted };
}
