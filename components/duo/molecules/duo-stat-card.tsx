"use client";

import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface DuoStatCardProps extends HTMLAttributes<HTMLDivElement> {
	icon?: LucideIcon;
	iconColor?: string;
	value: string | number;
	label: string;
	badge?: string;
}

export function DuoStatCard({
	icon: Icon,
	iconColor,
	value,
	label,
	badge,
	className,
	...props
}: DuoStatCardProps) {
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
			{Icon && (
				<span
					className="flex h-8 w-8 shrink-0 items-center justify-center"
					style={{ color: iconColor ?? "var(--duo-primary)" }}
				>
					<Icon size={24} aria-hidden="true" />
				</span>
			)}
			<div className="flex min-w-0 flex-col">
				<span className="tabular-nums text-xl font-extrabold leading-tight text-[var(--duo-fg)]">
					{value}
				</span>
				<span className="truncate text-xs text-[var(--duo-fg-muted)]">
					{label}
				</span>
			</div>
			{badge && (
				<span className="absolute -right-2 -top-2 animate-in zoom-in-75 rounded-full bg-[var(--duo-accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm duration-300">
					{badge}
				</span>
			)}
		</div>
	);
}
