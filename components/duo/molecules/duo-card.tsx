"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface DuoCardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "elevated" | "outlined" | "interactive";
	padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap: Record<string, string> = {
	none: "",
	sm: "p-3",
	md: "p-4 md:p-5",
	lg: "p-5 md:p-6",
};

export function DuoCard({
	variant = "default",
	padding = "md",
	className,
	children,
	...props
}: DuoCardProps) {
	return (
		<div
			className={cn(
				"rounded-2xl transition-all duration-300 ease-out",
				paddingMap[padding],
				variant === "default" &&
					"border border-[var(--duo-border)] bg-[var(--duo-bg-card)]",
				variant === "elevated" &&
					"bg-[var(--duo-bg-elevated)] shadow-lg shadow-black/10",
				variant === "outlined" &&
					"border-2 border-[var(--duo-border)] bg-transparent",
				variant === "interactive" && [
					"cursor-pointer border border-[var(--duo-border)] bg-[var(--duo-bg-card)]",
					"hover:scale-[1.02] hover:border-[var(--duo-primary)] hover:shadow-lg hover:shadow-[var(--duo-primary)]/5",
					"active:scale-[0.98]",
				],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function DuoCardHeader({
	className,
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("mb-3 flex items-center justify-between gap-3", className)}
			{...props}
		>
			{children}
		</div>
	);
}

export function DuoCardContent({
	className,
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("", className)} {...props}>
			{children}
		</div>
	);
}

export function DuoCardFooter({
	className,
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"mt-4 flex gap-3 border-t border-[var(--duo-border)] pt-3",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
