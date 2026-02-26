"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type DuoBadgeVariant =
	| "primary"
	| "secondary"
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "muted";
type DuoBadgeSize = "sm" | "md" | "lg";

interface DuoBadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: DuoBadgeVariant;
	size?: DuoBadgeSize;
	pulse?: boolean;
}

const variantStyles: Record<DuoBadgeVariant, string> = {
	primary: "bg-[var(--duo-primary)] text-white",
	secondary: "bg-[var(--duo-secondary)] text-white",
	accent: "bg-[var(--duo-accent)] text-white",
	success: "bg-[var(--duo-success)] text-white",
	warning: "bg-[var(--duo-warning)] text-white",
	danger: "bg-[var(--duo-danger)] text-white",
	muted: "bg-[var(--duo-bg-elevated)] text-[var(--duo-fg-muted)]",
};

const sizeStyles: Record<DuoBadgeSize, string> = {
	sm: "px-2 py-0.5 text-[10px]",
	md: "px-2.5 py-1 text-xs",
	lg: "px-3 py-1.5 text-sm",
};

export function DuoBadge({
	variant = "primary",
	size = "md",
	pulse = false,
	className,
	children,
	...props
}: DuoBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center whitespace-nowrap rounded-full font-bold uppercase tracking-wider transition-transform duration-200 hover:scale-105",
				variantStyles[variant],
				sizeStyles[size],
				pulse && "animate-pulse",
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
