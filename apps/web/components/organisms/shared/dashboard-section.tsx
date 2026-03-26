"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

interface DashboardSectionRootProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: ReactNode;
  description?: string;
  action?: ReactNode;
}

function DashboardSectionRoot({
  title,
  icon,
  description,
  action,
  className,
  children,
  ...props
}: DashboardSectionRootProps) {
  return (
    <DuoCard.Root
      variant="default"
      padding="md"
      className={cn("cq-dashboard-panel", className)}
      {...props}
    >
      <DuoCard.Header className="cq-dashboard-panel-header gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {icon}
          <div className="min-w-0">
            <h2 className="font-bold text-[var(--duo-fg)]">{title}</h2>
            {description ? (
              <p className="text-xs text-[var(--duo-fg-muted)]">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </DuoCard.Header>
      <DuoCard.Content className="px-0">{children}</DuoCard.Content>
    </DuoCard.Root>
  );
}

function DashboardSectionList({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {children}
    </div>
  );
}

function DashboardSectionEmpty({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("py-4 text-center text-sm text-duo-gray-dark", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export const DashboardSection = {
  Root: DashboardSectionRoot,
  List: DashboardSectionList,
  Empty: DashboardSectionEmpty,
};
