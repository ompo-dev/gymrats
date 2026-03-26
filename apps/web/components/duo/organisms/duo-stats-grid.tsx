"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DuoStatsGridRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

function DuoStatsGridRoot({
  children,
  columns = 2,
  className,
  style,
  ...props
}: DuoStatsGridRootProps) {
  const minColumnWidth =
    columns === 2 ? "14rem" : columns === 3 ? "12rem" : "10.5rem";

  return (
    <div
      data-slot="duo-stats-grid"
      className={cn(
        "cq-stats-grid grid gap-3",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}), 1fr))`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function DuoStatsGridItem({
  children,
  className,
  ...props
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="duo-stats-grid-item" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export const DuoStatsGrid = {
  Root: DuoStatsGridRoot,
  Item: DuoStatsGridItem,
};
