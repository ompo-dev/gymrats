"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface CustomCheckboxProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label?: string;
	description?: string;
	size?: "sm" | "md" | "lg";
	variant?: "default" | "rounded";
	disabled?: boolean;
	className?: string;
	delay?: number;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	ariaDescribedBy?: string;
}

export function CustomCheckbox({
	checked,
	onChange,
	label,
	description,
	size = "md",
	variant = "default",
	disabled = false,
	className,
	delay = 0,
	ariaLabel,
	ariaLabelledBy,
	ariaDescribedBy,
}: CustomCheckboxProps) {
	const checkboxId = useRef(
		`checkbox-${Math.random().toString(36).substr(2, 9)}`,
	);
	const labelId = label ? `${checkboxId.current}-label` : undefined;
	const descriptionId = description
		? `${checkboxId.current}-description`
		: undefined;

	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-5 w-5",
		lg: "h-6 w-6",
	};

	const iconSizes = {
		sm: "h-2.5 w-2.5",
		md: "h-3 w-3",
		lg: "h-4 w-4",
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			onChange(!checked);
		}
	};

	return (
		<motion.label
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, type: "spring" }}
			htmlFor={checkboxId.current}
			className={cn(
				"flex cursor-pointer items-start gap-3",
				disabled && "cursor-not-allowed opacity-50",
				className,
			)}
		>
			<div className="relative shrink-0">
				<input
					id={checkboxId.current}
					type="checkbox"
					checked={checked}
					onChange={(e) => !disabled && onChange(e.target.checked)}
					onKeyDown={handleKeyDown}
					disabled={disabled}
					aria-label={ariaLabel || (label ? undefined : "Checkbox")}
					aria-labelledby={ariaLabelledBy || labelId}
					aria-describedby={ariaDescribedBy || descriptionId}
					aria-checked={checked}
					className="sr-only"
				/>
				<motion.div
					role="checkbox"
					aria-hidden="true"
					tabIndex={-1}
					className={cn(
						"relative flex items-center justify-center border-2 transition-all focus-visible:outline-none",
						sizeClasses[size],
						variant === "rounded" ? "rounded-full" : "rounded-lg",
						checked
							? "border-duo-green bg-duo-green"
							: "border-gray-300 bg-white",
						!disabled && "hover:border-duo-green/70",
					)}
					animate={{
						scale: checked ? [1, 1.1, 1] : 1,
					}}
					transition={{ duration: 0.2 }}
				>
					{checked && (
						<motion.div
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 20 }}
						>
							<Check className={cn("text-white", iconSizes[size])} />
						</motion.div>
					)}
				</motion.div>
				{checked && (
					<motion.div
						className={cn(
							"absolute inset-0 rounded-full border-2 border-duo-green",
							variant === "rounded" ? "rounded-full" : "rounded-lg",
						)}
						animate={{
							scale: [1, 1.3, 1],
							opacity: [0.5, 0, 0.5],
						}}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>
				)}
			</div>
			{(label || description) && (
				<div className="flex-1">
					{label && (
						<span
							id={labelId}
							className="block text-sm font-bold text-gray-900"
						>
							{label}
						</span>
					)}
					{description && (
						<span
							id={descriptionId}
							className="mt-1 block text-xs text-gray-600"
						>
							{description}
						</span>
					)}
				</div>
			)}
		</motion.label>
	);
}
