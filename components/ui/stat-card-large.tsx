"use client";

import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "./duo-card";

export interface StatCardLargeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	icon: LucideIcon;
	value: string | number;
	label: string;
	subtitle?: string;
	iconColor?:
		| "duo-orange"
		| "duo-yellow"
		| "duo-blue"
		| "duo-green"
		| "duo-purple"
		| "duo-red";
}

const iconColorMap = {
	"duo-orange": "text-duo-orange",
	"duo-yellow": "text-duo-yellow",
	"duo-blue": "text-duo-blue",
	"duo-green": "text-duo-green",
	"duo-purple": "text-duo-purple",
	"duo-red": "text-duo-red",
};

export function StatCardLarge({
	icon: Icon,
	value,
	label,
	subtitle,
	iconColor = "duo-blue",
	className,
	...props
}: StatCardLargeProps) {
	return (
		<DuoCard
			variant="default"
			size="md"
			className={cn("text-center", className)}
			{...props}
		>
			<Icon className={cn("mx-auto mb-2 h-8 w-8", iconColorMap[iconColor])} />
			<div className="mb-1 text-2xl font-bold text-duo-text">{value}</div>
			<div className="text-xs text-duo-gray-dark">{label}</div>
			{subtitle && (
				<div className={cn("mt-2 text-xs font-bold", iconColorMap[iconColor])}>
					{subtitle}
				</div>
			)}
		</DuoCard>
	);
}
