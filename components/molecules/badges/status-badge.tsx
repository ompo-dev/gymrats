import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva("rounded-full px-3 py-1 text-xs font-bold", {
	variants: {
		status: {
			excelente: "bg-duo-green/20 text-duo-green",
			bom: "bg-duo-blue/20 text-duo-blue",
			regular: "bg-duo-orange/20 text-duo-orange",
			ruim: "bg-duo-red/20 text-duo-red",
		},
	},
	defaultVariants: {
		status: "regular",
	},
});

export interface StatusBadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof statusBadgeVariants> {
	label: string;
}

export function StatusBadge({
	status,
	label,
	className,
	...props
}: StatusBadgeProps) {
	return (
		<div className={cn(statusBadgeVariants({ status, className }))} {...props}>
			{label}
		</div>
	);
}
