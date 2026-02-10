"use client";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const stepperDotVariants = cva(
	"rounded-full transition-all duration-300 relative shrink-0",
	{
		variants: {
			status: {
				completed: "bg-[#58CC02] shadow-sm",
				skipped: "bg-[#ff9600] shadow-sm",
				default: "bg-gray-300",
			},
			isCurrent: {
				true: "ring-2 ring-offset-1 ring-offset-white",
				false: "",
			},
			size: {
				default: "h-2 w-2 sm:h-2.5 sm:w-2.5",
				sm: "h-1.5 w-1.5 sm:h-2 sm:w-2",
				lg: "h-2.5 w-2.5 sm:h-3 sm:w-3",
			},
		},
		compoundVariants: [
			{
				isCurrent: true,
				status: "completed",
				class: "ring-[#58CC02]",
			},
			{
				isCurrent: true,
				status: "skipped",
				class: "ring-[#ff9600]",
			},
			{
				isCurrent: true,
				status: "default",
				class: "ring-gray-400",
			},
		],
		defaultVariants: {
			status: "default",
			isCurrent: false,
			size: "default",
		},
	},
);

export type StepperDotStatus = "completed" | "skipped" | "default";

type StepperDotProps = VariantProps<typeof stepperDotVariants> & {
	className?: string;
	title?: string;
};

function StepperDot({
	status = "default",
	isCurrent = false,
	size = "default",
	className,
	title,
	...props
}: StepperDotProps) {
	return (
		<span
			aria-current={isCurrent ? "step" : undefined}
			className={cn(stepperDotVariants({ status, isCurrent, size }), className)}
			style={status === "skipped" ? { backgroundColor: "#ff9600" } : undefined}
			title={title}
			{...props}
		/>
	);
}

export { StepperDot, stepperDotVariants };
