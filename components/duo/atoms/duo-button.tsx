"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import {
	forwardRef,
	type ButtonHTMLAttributes,
	type ComponentPropsWithoutRef,
} from "react";
import { cn } from "@/lib/utils";

type DuoButtonVariant =
	| "primary"
	| "secondary"
	| "accent"
	| "danger"
	| "ghost"
	| "outline"
	| "locked"
	| "white"
	| "destructive"
	| "link";

type DuoButtonSize = "sm" | "md" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg";

export interface DuoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: DuoButtonVariant;
	size?: DuoButtonSize;
	isLoading?: boolean;
	loading?: boolean;
	fullWidth?: boolean;
	asChild?: boolean;
}

const variantStyles: Record<DuoButtonVariant, string> = {
	primary:
		"bg-[var(--duo-primary)] text-white border-b-4 border-[var(--duo-primary-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
	secondary:
		"bg-[var(--duo-secondary)] text-white border-b-4 border-[var(--duo-secondary-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
	accent:
		"bg-[var(--duo-accent)] text-white border-b-4 border-[var(--duo-accent-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
	danger:
		"bg-[var(--duo-danger)] text-white border-b-4 border-[var(--duo-danger-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
	ghost:
		"bg-transparent text-[var(--duo-fg)] hover:bg-[var(--duo-bg-elevated)] border-b-0 active:scale-95",
	outline:
		"bg-transparent text-[var(--duo-fg)] border-2 border-[var(--duo-border)] hover:border-[var(--duo-primary)] hover:text-[var(--duo-primary)] active:scale-95",
	locked:
		"bg-[var(--duo-bg-elevated)] text-[var(--duo-fg-muted)] border-b-4 border-[var(--duo-border)] cursor-not-allowed opacity-60",
	white:
		"bg-white text-[var(--duo-primary)] border-b-4 border-gray-200 hover:bg-gray-50 active:border-b-0 active:mt-1 active:brightness-95",
	destructive:
		"bg-[var(--duo-danger)] text-white border-b-4 border-[var(--duo-danger-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
	link: "bg-transparent text-[var(--duo-secondary)] hover:underline border-b-0 active:scale-95",
};

const sizeStyles: Record<DuoButtonSize, string> = {
	sm: "px-4 py-1.5 text-sm rounded-xl min-h-[32px]",
	md: "px-6 py-2.5 text-base rounded-xl min-h-[42px]",
	lg: "px-8 py-3.5 text-lg rounded-2xl min-h-[52px]",
	xl: "px-10 py-4 text-xl rounded-2xl min-h-[60px]",
	icon: "p-2.5 rounded-xl min-h-[42px] min-w-[42px] flex items-center justify-center",
	"icon-sm": "p-2 rounded-xl min-h-[32px] min-w-[32px] flex items-center justify-center",
	"icon-lg": "p-3 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center",
};

export const DuoButton = forwardRef<HTMLButtonElement, DuoButtonProps>(
	(
		{
			variant = "primary",
			size = "md",
			isLoading = false,
			loading = false,
			fullWidth = false,
			asChild = false,
			className,
			disabled,
			children,
			...props
		},
		ref,
	) => {
		const isDisabled = disabled || isLoading || loading || variant === "locked";
		const resolvedVariant =
			variant === "destructive" ? "danger" : variant;

		const buttonClassName = cn(
			"inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold uppercase tracking-wider transition-all duration-150 ease-out select-none touch-manipulation",
			"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--duo-primary)]",
			variantStyles[resolvedVariant],
			sizeStyles[size],
			fullWidth && "w-full",
			isDisabled && resolvedVariant !== "locked" && "opacity-50 cursor-not-allowed",
			className,
		);

		const content = isLoading || loading ? (
			<span className="inline-flex items-center gap-2">
				<svg
					className="h-4 w-4 animate-spin"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/>
				</svg>
				<span className="sr-only">Carregando</span>
			</span>
		) : (
			children
		);

		if (asChild && !isDisabled) {
			return (
				<Slot
					ref={ref as React.Ref<HTMLAnchorElement>}
					className={buttonClassName}
					{...(props as ComponentPropsWithoutRef<typeof Slot>)}
				>
					{children}
				</Slot>
			);
		}

		return (
			<button
				ref={ref}
				disabled={isDisabled}
				className={buttonClassName}
				aria-disabled={isDisabled}
				{...props}
			>
				{content}
			</button>
		);
	},
);

DuoButton.displayName = "DuoButton";

export const duoButtonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold uppercase tracking-wider transition-all duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--duo-primary)]",
	{
		variants: {
			variant: variantStyles,
			size: sizeStyles,
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);
