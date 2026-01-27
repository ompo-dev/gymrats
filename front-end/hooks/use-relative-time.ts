"use client";

import { useState, useEffect } from "react";

export function useRelativeTime(timestamp: Date) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  const calculateTimeAgo = (baseTime: number) => {
    const diff = baseTime - timestamp.getTime();
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
  }, [timestamp]);

  return { timeAgo, mounted };
}
