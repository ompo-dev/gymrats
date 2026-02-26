"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DuoStatsGridProps {
	children: ReactNode;
	columns?: 2 | 3 | 4;
	className?: string;
}

export function DuoStatsGrid({
	children,
	columns = 2,
	className,
}: DuoStatsGridProps) {
	return (
		<div
			className={cn(
				"grid gap-3",
				columns === 2 && "grid-cols-2",
				columns === 3 && "grid-cols-2 sm:grid-cols-3",
				columns === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
				className,
			)}
		>
			{children}
		</div>
	);
}
