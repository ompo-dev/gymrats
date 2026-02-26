"use client";

import { motion } from "motion/react";
import { forwardRef } from "react";
import { DuoInput } from "@/components/duo";
import { cn } from "@/lib/utils";

interface FormInputProps {
	label?: string;
	placeholder?: string;
	type?: "text" | "number" | "email" | "password" | "tel" | "url";
	value: string | number;
	onChange: (value: string | number) => void;
	error?: string;
	required?: boolean;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
	delay?: number;
	icon?: React.ReactNode;
	maxLength?: number;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
	(
		{
			label,
			placeholder,
			type = "text",
			value,
			onChange,
			error,
			required,
			disabled,
			size = "md",
			className,
			delay = 0,
			icon,
			maxLength,
		},
		ref,
	) => {
		const sizeClasses = {
			sm: "h-10 text-sm",
			md: "h-12 text-base",
			lg: "h-14 text-lg",
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (type === "number") {
				const numValue = e.target.value ? parseFloat(e.target.value) : "";
				onChange(numValue);
			} else {
				onChange(e.target.value);
			}
		};

		return (
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay, type: "spring" }}
				className={cn("space-y-2", className)}
			>
				<DuoInput
					ref={ref}
					label={label ? `${label}${required ? " *" : ""}` : undefined}
					leftIcon={icon}
					error={error}
					type={type}
					value={String(value || "")}
					onChange={handleChange}
					placeholder={placeholder}
					disabled={disabled}
					maxLength={maxLength}
					required={required}
					className={cn(sizeClasses[size])}
				/>
			</motion.div>
		);
	},
);

FormInput.displayName = "FormInput";
