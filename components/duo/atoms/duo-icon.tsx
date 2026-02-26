"use client";

import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type DuoIconSize = "xs" | "sm" | "md" | "lg" | "xl";
type DuoIconColor =
	| "primary"
	| "secondary"
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "muted"
	| "current";

interface DuoIconProps extends HTMLAttributes<HTMLSpanElement> {
	icon: LucideIcon;
	size?: DuoIconSize;
	color?: DuoIconColor;
}

const sizeMap: Record<DuoIconSize, { wrapper: string; icon: number }> = {
	xs: { wrapper: "h-4 w-4", icon: 14 },
	sm: { wrapper: "h-5 w-5", icon: 18 },
	md: { wrapper: "h-6 w-6", icon: 22 },
	lg: { wrapper: "h-8 w-8", icon: 28 },
	xl: { wrapper: "h-10 w-10", icon: 36 },
};

const colorMap: Record<DuoIconColor, string> = {
	primary: "text-[var(--duo-primary)]",
	secondary: "text-[var(--duo-secondary)]",
	accent: "text-[var(--duo-accent)]",
	success: "text-[var(--duo-success)]",
	warning: "text-[var(--duo-warning)]",
	danger: "text-[var(--duo-danger)]",
	muted: "text-[var(--duo-fg-muted)]",
	current: "text-current",
};

export function DuoIcon({
	icon: Icon,
	size = "md",
	color = "current",
	className,
	...props
}: DuoIconProps) {
	const config = sizeMap[size];

	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center",
				config.wrapper,
				colorMap[color],
				className,
			)}
			{...props}
		>
			<Icon size={config.icon} aria-hidden="true" />
		</span>
	);
}
