"use client";

import * as React from "react";
import { DuoButton, duoButtonVariants } from "@/components/duo";

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

export interface ButtonProps
	extends Omit<React.ComponentProps<typeof DuoButton>, "variant" | "size"> {
	variant?: LegacyVariant;
	size?: LegacySize;
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

/** Para uso com cn() - aceita variant legado e retorna classes Duo */
export const buttonVariants = (
	opts?: { variant?: LegacyVariant; size?: LegacySize },
) => {
	const v = opts?.variant ? VARIANT_MAP[opts.variant] : "primary";
	const s = opts?.size ? SIZE_MAP[opts.size] : "md";
	return duoButtonVariants({ variant: v, size: s });
};

export { Button };
