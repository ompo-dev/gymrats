"use client";

import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard, DuoCardHeader } from "./duo-card";

export interface DuoSectionCardProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	icon?: LucideIcon;
	title: string;
	headerAction?: React.ReactNode;
	sectionLabel?: string;
	buttonHref?: string;
	variant?: "default" | "small" | "highlighted" | "blue" | "orange" | "yellow";
}

const variantStyles: Record<
	Exclude<NonNullable<DuoSectionCardProps["variant"]>, "default" | "small">,
	string
> = {
	highlighted:
		"rounded-xl border-2 border-[var(--duo-primary)] bg-[var(--duo-primary)]/10 shadow-[0_2px_0_var(--duo-primary-dark)]",
	blue: "rounded-xl border-2 border-[var(--duo-secondary)] bg-[var(--duo-secondary)]/10 shadow-[0_2px_0_var(--duo-secondary-dark)]",
	orange:
		"rounded-xl border-2 border-[var(--duo-accent)] bg-[var(--duo-accent)]/10 shadow-[0_2px_0_var(--duo-accent-dark)]",
	yellow:
		"rounded-xl border-2 border-[var(--duo-warning)] bg-[var(--duo-warning)]/10 shadow-[0_2px_0_var(--duo-warning-dark)]",
};

export function DuoSectionCard({
	icon: Icon,
	title,
	headerAction,
	children,
	className,
	sectionLabel,
	buttonHref,
	variant = "default",
	...props
}: DuoSectionCardProps) {
	const hasVariantStyle =
		variant && variant !== "default" && variant !== "small";
	return (
		<DuoCard
			variant="default"
			padding={variant === "small" ? "sm" : "md"}
			className={cn(
				hasVariantStyle && variantStyles[variant],
				className,
			)}
			{...props}
		>
			<DuoCardHeader className={variant === "small" ? "mb-2" : "mb-4"}>
				<div className="flex items-center gap-2">
					{Icon && (
						<Icon
							className="h-5 w-5 shrink-0"
							style={{ color: "var(--duo-secondary)" }}
							aria-hidden
						/>
					)}
					<h2 className="font-bold text-[var(--duo-fg)]">{title}</h2>
				</div>
				{headerAction}
			</DuoCardHeader>
			{children}
		</DuoCard>
	);
}
