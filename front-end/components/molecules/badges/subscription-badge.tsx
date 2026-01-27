"use client";

import { Crown, Gift, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionBadgeProps {
  status: "trial" | "premium" | "free";
  daysRemaining?: number;
  className?: string;
}

export function SubscriptionBadge({
  status,
  daysRemaining,
  className,
}: SubscriptionBadgeProps) {
  if (status === "trial") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-duo-blue/20 px-3 py-1 text-xs font-bold text-duo-blue",
          className
        )}
      >
        <Gift className="h-3.5 w-3.5" />
        <span>
          Trial {daysRemaining !== undefined ? `(${daysRemaining}d)` : ""}
        </span>
      </div>
    );
  }

  if (status === "premium") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-duo-green/20 px-3 py-1 text-xs font-bold text-duo-green",
          className
        )}
      >
        <Crown className="h-3.5 w-3.5" />
        <span>Premium</span>
      </div>
    );
  }

  return null;
}

