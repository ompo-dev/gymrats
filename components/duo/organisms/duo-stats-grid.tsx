"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DuoStatsGridRootProps {
	children: ReactNode;
	columns?: 2 | 3 | 4;
	className?: string;
}

function DuoStatsGridRoot({
	children,
	columns = 2,
	className,
}: DuoStatsGridRootProps) {
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

function DuoStatsGridItem({ children, className, ...props }: { children?: ReactNode; className?: string }) {
	return (
		<div className={cn(className)} {...props}>
			{children}
		</div>
	);
}

export const DuoStatsGrid = {
	Root: DuoStatsGridRoot,
	Item: DuoStatsGridItem,
};
