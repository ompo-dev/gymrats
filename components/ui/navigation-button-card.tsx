import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { DuoCard } from "./duo-card";

export interface NavigationButtonCardProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
	icon: LucideIcon;
	title: string;
	description: string;
	color?:
		| "duo-green"
		| "duo-red"
		| "duo-orange"
		| "duo-blue"
		| "duo-yellow"
		| "duo-purple";
	onClick?: () => void;
}

const variantMap = {
	"duo-green": "highlighted",
	"duo-red": "default",
	"duo-orange": "orange",
	"duo-blue": "blue",
	"duo-yellow": "yellow",
	"duo-purple": "default",
} as const;

const iconBgClasses = {
	"duo-green": "bg-duo-green",
	"duo-red": "bg-duo-red",
	"duo-orange": "bg-duo-orange",
	"duo-blue": "bg-duo-blue",
	"duo-yellow": "bg-duo-yellow",
	"duo-purple": "bg-duo-purple",
};

const shadowMap = {
	"duo-green": "shadow-[0_2px_0_#58A700]",
	"duo-red": "shadow-[0_2px_0_#E63939]",
	"duo-orange": "shadow-[0_2px_0_#E68A00]",
	"duo-blue": "shadow-[0_2px_0_#1899D6]",
	"duo-yellow": "shadow-[0_2px_0_#E6B800]",
	"duo-purple": "shadow-[0_2px_0_#B870E6]",
} as const;

export function NavigationButtonCard({
	icon: Icon,
	title,
	description,
	color = "duo-green",
	className,
	onClick,
	...props
}: NavigationButtonCardProps) {
	const variant = variantMap[color];

	return (
		<DuoCard
			variant={variant}
			size="md"
			onClick={onClick}
			className={cn(
				onClick &&
					"cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]",
				color === "duo-red" && "border-duo-red bg-duo-red/10",
				color === "duo-purple" && "border-duo-purple bg-duo-purple/10",
				color === "duo-red" && shadowMap["duo-red"],
				color === "duo-purple" && shadowMap["duo-purple"],
				className,
			)}
			{...props}
		>
			<div className="flex items-center gap-4">
				<div
					className={cn(
						"flex h-12 w-12 items-center justify-center rounded-xl",
						iconBgClasses[color],
					)}
				>
					<Icon className="h-6 w-6 text-white" />
				</div>
				<div className="flex-1">
					<h3 className="font-bold text-duo-text">{title}</h3>
					<p className="text-xs text-duo-gray-dark">{description}</p>
				</div>
			</div>
		</DuoCard>
	);
}
