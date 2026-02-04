import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "./duo-card";
import { StatusBadge } from "./status-badge";

export interface HistoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	date: string | Date;
	status?: "excelente" | "bom" | "regular" | "ruim";
	metadata?: Array<{
		icon?: string;
		label: string;
	}>;
}

export function HistoryCard({
	title,
	date,
	status,
	metadata = [],
	className,
	...props
}: HistoryCardProps) {
	const formattedDate =
		typeof date === "string"
			? date
			: new Date(date).toLocaleDateString("pt-BR");

	return (
		<DuoCard
			variant="default"
			size="md"
			className={cn("bg-gray-50", className)}
			{...props}
		>
			<div className="mb-2 flex items-start justify-between">
				<div>
					<div className="font-bold text-duo-text">{title}</div>
					<div className="text-xs text-duo-gray-dark">{formattedDate}</div>
				</div>
				{status && <StatusBadge status={status} label={status} />}
			</div>
			{metadata.length > 0 && (
				<div className="flex gap-4 text-sm text-duo-gray-dark">
					{metadata.map((item, index) => (
						<div key={index}>
							{item.icon && <span>{item.icon} </span>}
							{item.label}
						</div>
					))}
				</div>
			)}
		</DuoCard>
	);
}
