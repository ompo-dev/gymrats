"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DuoInputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
}

export const DuoInput = forwardRef<HTMLInputElement, DuoInputProps>(
	(
		{
			label,
			error,
			helperText,
			leftIcon,
			rightIcon,
			className,
			id: propId,
			...props
		},
		ref,
	) => {
		const autoId = useId();
		const id = propId ?? autoId;
		const errorId = error ? `${id}-error` : undefined;
		const helperId = helperText ? `${id}-helper` : undefined;

		return (
			<div className={cn("flex w-full flex-col gap-1.5", className)}>
				{label && (
					<label
						htmlFor={id}
						className="text-sm font-bold uppercase tracking-wider text-[var(--duo-fg-muted)]"
					>
						{label}
					</label>
				)}
				<div className="group relative">
					{leftIcon && (
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--duo-fg-muted)] transition-colors duration-200 group-focus-within:text-[var(--duo-primary)]">
							{leftIcon}
						</span>
					)}
					<input
						ref={ref}
						id={id}
						aria-describedby={errorId ?? helperId}
						aria-invalid={!!error}
						className={cn(
							"w-full rounded-xl border-2 bg-[var(--duo-bg-card)] px-4 py-3 text-base text-[var(--duo-fg)]",
							"placeholder:opacity-60 placeholder:text-[var(--duo-fg-muted)]",
							"transition-all duration-200 ease-out",
							"focus:border-[var(--duo-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--duo-primary)]/20",
							"hover:border-[var(--duo-fg-muted)]",
							error
								? "border-[var(--duo-danger)] focus:border-[var(--duo-danger)] focus:ring-[var(--duo-danger)]/20"
								: "border-[var(--duo-border)]",
							leftIcon && "pl-10",
							rightIcon && "pr-10",
							"disabled:cursor-not-allowed disabled:opacity-50",
						)}
						{...props}
					/>
					{rightIcon && (
						<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--duo-fg-muted)]">
							{rightIcon}
						</span>
					)}
				</div>
				{error && (
					<span
						id={errorId}
						className="text-xs font-semibold text-[var(--duo-danger)] animate-in slide-in-from-top-1 duration-200"
						role="alert"
					>
						{error}
					</span>
				)}
				{!error && helperText && (
					<span id={helperId} className="text-xs text-[var(--duo-fg-muted)]">
						{helperText}
					</span>
				)}
			</div>
		);
	},
);

DuoInput.displayName = "DuoInput";
