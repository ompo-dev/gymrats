"use client";

import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { DuoProgress } from "../atoms/duo-progress";

interface DuoAchievementCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
  current: number;
  total: number;
  level?: number;
}

export function DuoAchievementCard({
  icon: Icon,
  iconColor,
  title,
  description,
  current,
  total,
  level,
  className,
  ...props
}: DuoAchievementCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-4",
        "border border-[var(--duo-border)] bg-[var(--duo-bg-card)]",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.01] hover:border-[var(--duo-primary)]/40 hover:shadow-md",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--duo-bg-elevated)]">
          <Icon
            size={28}
            style={{ color: iconColor ?? "var(--duo-accent)" }}
            aria-hidden="true"
          />
          {level !== undefined && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--duo-accent)] px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white">
              {level}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-3 truncate text-sm font-bold text-[var(--duo-fg)]">
            {title}
          </span>
          <div className="flex items-center gap-0.5">
            <span className="block tabular-nums text-xs font-bold text-[var(--duo-fg-muted)]">
              {current}/{total}
            </span>
            <p className="truncate text-xs text-[var(--duo-fg-muted)]">
              {description}
            </p>
          </div>
          <DuoProgress
            value={current}
            max={total}
            variant="accent"
            size="sm"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
