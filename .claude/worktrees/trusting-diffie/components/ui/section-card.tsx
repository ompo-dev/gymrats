import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "./duo-card";

export interface SectionCardProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
	icon?: LucideIcon;
	title: string;
	headerAction?: React.ReactNode;
	sectionLabel?: string;
	buttonHref?: string;
	variant?: "default" | "small" | "highlighted" | "blue" | "orange" | "yellow";
}

export function SectionCard({
	icon: Icon,
	title,
	headerAction,
	children,
	className,
	sectionLabel,
	buttonHref,
	variant,
	...props
}: SectionCardProps) {
	return (
		<DuoCard
			variant={variant || "default"}
			size="default"
			className={cn(className)}
			{...props}
		>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					{Icon && <Icon className="h-5 w-5 text-duo-blue" />}
					<h2 className="font-bold text-duo-text">{title}</h2>
				</div>
				{headerAction}
			</div>
			{children}
		</DuoCard>
	);
}
