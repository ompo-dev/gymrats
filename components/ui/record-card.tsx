import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "./duo-card";

export interface RecordCardProps extends React.HTMLAttributes<HTMLDivElement> {
	exerciseName: string;
	date: string | Date;
	value: string | number;
	unit: string;
	previousBest?: number;
	icon?: string | React.ReactNode;
}

export function RecordCard({
	exerciseName,
	date,
	value,
	unit,
	previousBest,
	icon = "🏆",
	className,
	...props
}: RecordCardProps) {
	const formattedDate =
		typeof date === "string"
			? date
			: new Date(date).toLocaleDateString("pt-BR");

	const improvement =
		previousBest && typeof value === "number" ? value - previousBest : null;

	return (
		<DuoCard variant="yellow" size="md" className={cn(className)} {...props}>
			<div className="mb-2 flex items-start justify-between">
				<div>
					<div className="font-bold text-duo-text">{exerciseName}</div>
					<div className="text-xs text-duo-gray-dark">{formattedDate}</div>
				</div>
				<div className="text-2xl">{icon}</div>
			</div>
			<div className="flex items-center gap-2">
				<div className="text-2xl font-bold text-duo-yellow">
					{value}
					{unit}
				</div>
				{improvement !== null && improvement > 0 && (
					<div className="rounded-full bg-duo-green/20 px-2 py-1 text-xs font-bold text-duo-green">
						+{improvement}
					</div>
				)}
			</div>
		</DuoCard>
	);
}
