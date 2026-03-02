"use client";

import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DuoStatCardRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function DuoStatCardRoot({
  className,
  children,
  ...props
}: DuoStatCardRootProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-2xl px-4 py-3",
        "border border-[var(--duo-border)] bg-[var(--duo-bg-card)]",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:border-[var(--duo-primary)] hover:shadow-lg hover:shadow-[var(--duo-primary)]/10",
        "active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DuoStatCardIconProps {
  icon: LucideIcon;
  iconColor?: string;
}

function DuoStatCardIcon({ icon: Icon, iconColor }: DuoStatCardIconProps) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center"
      style={{ color: iconColor ?? "var(--duo-primary)" }}
    >
      <Icon size={24} aria-hidden="true" />
    </span>
  );
}

function DuoStatCardValue({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "tabular-nums text-xl font-extrabold leading-tight text-[var(--duo-fg)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function DuoStatCardLabel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("truncate text-xs text-[var(--duo-fg-muted)]", className)}
      {...props}
    >
      {children}
    </span>
  );
}

function DuoStatCardContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)} {...props}>
      {children}
    </div>
  );
}

interface DuoStatCardBadgeProps {
  children: ReactNode;
}

function DuoStatCardBadge({ children }: DuoStatCardBadgeProps) {
  return (
    <span className="absolute -right-2 -top-2 animate-in zoom-in-75 rounded-full bg-[var(--duo-accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm duration-300">
      {children}
    </span>
  );
}

interface DuoStatCardSimpleProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  iconColor?: string;
  value: string | number;
  label: string;
  badge?: string;
}

function DuoStatCardSimple({
  icon: Icon,
  iconColor,
  value,
  label,
  badge,
  className,
  ...props
}: DuoStatCardSimpleProps) {
  return (
    <DuoStatCardRoot className={className} {...props}>
      {Icon && <DuoStatCardIcon icon={Icon} iconColor={iconColor} />}
      <DuoStatCardContent>
        <DuoStatCardValue>{value}</DuoStatCardValue>
        <DuoStatCardLabel>{label}</DuoStatCardLabel>
      </DuoStatCardContent>
      {badge && <DuoStatCardBadge>{badge}</DuoStatCardBadge>}
    </DuoStatCardRoot>
  );
}

export const DuoStatCard = {
  Root: DuoStatCardRoot,
  Icon: DuoStatCardIcon,
  Value: DuoStatCardValue,
  Label: DuoStatCardLabel,
  Content: DuoStatCardContent,
  Badge: DuoStatCardBadge,
  /** Conveniência: aceita props (icon, value, label, badge) e renderiza a composição internamente */
  Simple: DuoStatCardSimple,
};
