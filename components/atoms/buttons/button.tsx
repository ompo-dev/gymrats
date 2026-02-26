"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DuoButton } from "@/components/duo/atoms/duo-button";

type LegacyVariant =
	| "default"
	| "white"
	| "light-blue"
	| "disabled"
	| "destructive"
	| "outline"
	| "secondary"
	| "ghost"
	| "link";

type LegacySize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

const VARIANT_MAP: Record<LegacyVariant, React.ComponentProps<typeof DuoButton>["variant"]> = {
	default: "primary",
	white: "white",
	"light-blue": "secondary",
	disabled: "locked",
	destructive: "danger",
	outline: "outline",
	secondary: "outline",
	ghost: "ghost",
	link: "link",
};

const SIZE_MAP: Record<LegacySize, React.ComponentProps<typeof DuoButton>["size"]> = {
	default: "md",
	sm: "sm",
	lg: "lg",
	icon: "icon",
	"icon-sm": "icon-sm",
	"icon-lg": "icon-lg",
};

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold uppercase tracking-wider transition-all duration-150 ease-out select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--duo-primary)]",
	{
		variants: {
			variant: {
				default:
					"bg-[var(--duo-primary)] text-white border-b-4 border-[var(--duo-primary-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
				white:
					"bg-white text-[var(--duo-primary)] border-b-4 border-gray-200 hover:bg-gray-50 active:border-b-0 active:mt-1 active:brightness-95",
				"light-blue":
					"bg-[var(--duo-secondary)] text-white border-b-4 border-[var(--duo-secondary-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
				disabled:
					"bg-[var(--duo-bg-elevated)] text-[var(--duo-fg-muted)] border-b-4 border-[var(--duo-border)] cursor-not-allowed opacity-60",
				destructive:
					"bg-[var(--duo-danger)] text-white border-b-4 border-[var(--duo-danger-dark)] hover:brightness-110 active:border-b-0 active:mt-1 active:brightness-95",
				outline:
					"bg-transparent text-[var(--duo-fg)] border-2 border-[var(--duo-border)] hover:border-[var(--duo-primary)] hover:text-[var(--duo-primary)] active:scale-95",
				secondary:
					"bg-transparent text-[var(--duo-fg)] border-2 border-[var(--duo-border)] hover:border-[var(--duo-primary)] hover:text-[var(--duo-primary)] active:scale-95",
				ghost:
					"bg-transparent text-[var(--duo-fg)] hover:bg-[var(--duo-bg-elevated)] border-b-0 active:scale-95",
				link: "bg-transparent text-[var(--duo-secondary)] hover:underline border-b-0 active:scale-95",
			},
			size: {
				default: "px-6 py-2.5 text-base rounded-xl min-h-[42px]",
				sm: "px-4 py-1.5 text-sm rounded-xl min-h-[32px]",
				lg: "px-8 py-3.5 text-lg rounded-2xl min-h-[52px]",
				icon: "p-2.5 rounded-xl min-h-[42px] min-w-[42px] flex items-center justify-center",
				"icon-sm": "p-2 rounded-xl min-h-[32px] min-w-[32px] flex items-center justify-center",
				"icon-lg": "p-3 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends Omit<React.ComponentProps<typeof DuoButton>, "variant" | "size">,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "default", size = "default", ...props }, ref) => (
		<DuoButton
			ref={ref}
			variant={VARIANT_MAP[variant ?? "default"]}
			size={SIZE_MAP[size ?? "default"]}
			{...props}
		/>
	),
);

Button.displayName = "Button";

export { Button, buttonVariants };
