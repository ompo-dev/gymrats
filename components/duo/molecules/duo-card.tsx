"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type DuoCardVariant =
	| "default"
	| "elevated"
	| "outlined"
	| "interactive"
	| "small"
	| "highlighted"
	| "blue"
	| "orange"
	| "yellow";

interface DuoCardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: DuoCardVariant;
	padding?: "none" | "sm" | "md" | "lg";
	/** @deprecated Use padding instead. Mapped: sm->sm, md->md, default->md, lg->lg */
	size?: "sm" | "md" | "default" | "lg";
}

const paddingMap: Record<string, string> = {
	none: "",
	sm: "p-3",
	md: "p-4 md:p-5",
	lg: "p-5 md:p-6",
};

const variantStyles: Record<Exclude<DuoCardVariant, "default" | "elevated" | "outlined" | "interactive">, string> = {
	small: "rounded-xl border-2 border-[var(--duo-border)] shadow-[0_2px_0_#D1D5DB]",
	highlighted:
		"rounded-xl border-2 border-[var(--duo-primary)] bg-[var(--duo-primary)]/10 shadow-[0_2px_0_#46A302]",
	blue: "rounded-xl border-2 border-[var(--duo-secondary)] bg-[var(--duo-secondary)]/10 shadow-[0_2px_0_#1899D6]",
	orange:
		"rounded-xl border-2 border-[var(--duo-accent)] bg-[var(--duo-accent)]/10 shadow-[0_2px_0_#E08600]",
	yellow:
		"rounded-xl border-2 border-[var(--duo-warning)] bg-[var(--duo-warning)]/10 shadow-[0_2px_0_#E0B000]",
};

export function DuoCard({
	variant = "default",
	padding,
	size,
	className,
	children,
	...props
}: DuoCardProps) {
	const effectivePadding =
		padding ?? (size === "sm" ? "sm" : size === "lg" ? "lg" : size === "md" ? "md" : "md");
	const hasLegacyVariant =
		variant === "small" ||
		variant === "highlighted" ||
		variant === "blue" ||
		variant === "orange" ||
		variant === "yellow";

	return (
		<div
			className={cn(
				"bg-[var(--duo-bg-card)] transition-all duration-300 ease-out",
				paddingMap[effectivePadding],
				!hasLegacyVariant && "rounded-2xl",
				variant === "default" &&
					"border border-[var(--duo-border)] shadow-[0_4px_0_#D1D5DB]",
				variant === "elevated" &&
					"bg-[var(--duo-bg-elevated)] shadow-lg shadow-black/10",
				variant === "outlined" &&
					"border-2 border-[var(--duo-border)] bg-transparent",
				variant === "interactive" && [
					"cursor-pointer border border-[var(--duo-border)]",
					"hover:scale-[1.02] hover:border-[var(--duo-primary)] hover:shadow-lg hover:shadow-[var(--duo-primary)]/5",
					"active:scale-[0.98]",
				],
				hasLegacyVariant && variantStyles[variant],
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
