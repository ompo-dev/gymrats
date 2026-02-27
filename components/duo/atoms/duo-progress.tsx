"use client";

import { useEffect, useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type DuoProgressVariant =
	| "primary"
	| "secondary"
	| "accent"
	| "success"
	| "warning"
	| "danger";
type DuoProgressSize = "sm" | "md" | "lg";

interface DuoProgressProps extends HTMLAttributes<HTMLDivElement> {
	value: number;
	max?: number;
	variant?: DuoProgressVariant;
	size?: DuoProgressSize;
	showLabel?: boolean;
	animated?: boolean;
}

const variantBg: Record<DuoProgressVariant, string> = {
	primary: "bg-[var(--duo-primary)]",
	secondary: "bg-[var(--duo-secondary)]",
	accent: "bg-[var(--duo-accent)]",
	success: "bg-[var(--duo-success)]",
	warning: "bg-[var(--duo-warning)]",
	danger: "bg-[var(--duo-danger)]",
};

const sizeStyles: Record<DuoProgressSize, string> = {
	sm: "h-2 rounded-full",
	md: "h-3 rounded-full",
	lg: "h-5 rounded-full",
};

export function DuoProgress({
	value,
	max = 100,
	variant = "primary",
	size = "md",
	showLabel = false,
	animated = true,
	className,
	...props
}: DuoProgressProps) {
	const [displayWidth, setDisplayWidth] = useState(0);
	const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

	useEffect(() => {
		if (animated) {
			const timer = setTimeout(() => setDisplayWidth(percentage), 50);
			return () => clearTimeout(timer);
		}
		setDisplayWidth(percentage);
	}, [percentage, animated]);

	return (
		<div className={cn("flex items-center gap-3", className)} {...props}>
			<div
				className={cn(
					"flex-1 overflow-hidden bg-[var(--duo-bg-elevated)]",
					sizeStyles[size],
				)}
				role="progressbar"
				aria-valuenow={value}
				aria-valuemin={0}
				aria-valuemax={max}
				aria-label={`Progresso: ${Math.round(percentage)}%`}
			>
				<div
					className={cn(
						"h-full rounded-full transition-all duration-700 ease-out",
						variantBg[variant],
						animated && "will-change-[width]",
					)}
					style={{ width: `${displayWidth}%` }}
				/>
			</div>
			{showLabel && (
				<span className="min-w-[40px] text-right text-sm font-bold tabular-nums text-[var(--duo-fg-muted)]">
					{Math.round(percentage)}%
				</span>
			)}
		</div>
	);
}
