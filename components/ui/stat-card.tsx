import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "./duo-card";

export interface StatCardProps {
	value: string | number | React.ReactNode;
	label: string;
	variant?: "default" | "highlighted" | "blue" | "orange" | "yellow";
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function StatCard({
	value,
	label,
	variant = "default",
	size = "sm",
	className,
}: StatCardProps) {
	const isHighlighted = variant === "highlighted";

	return (
		<DuoCard
			variant={variant === "default" ? "small" : variant}
			size={size}
			className={cn("text-center", className)}
		>
			<div
				className={cn(
					"mb-1 font-bold",
					size === "sm" ? "text-xl" : size === "md" ? "text-2xl" : "text-3xl",
					isHighlighted ? "text-duo-green" : "text-gray-900",
				)}
			>
				{value}
			</div>
			<div
				className={cn(
					"font-semibold",
					size === "sm" ? "text-xs" : "text-sm",
					isHighlighted ? "text-duo-green" : "text-gray-600",
				)}
			>
				{label}
			</div>
		</DuoCard>
	);
}
