"use client";

import { type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type DuoTextVariant =
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "body"
	| "body-sm"
	| "caption"
	| "label"
	| "overline";

interface DuoTextProps extends HTMLAttributes<HTMLElement> {
	variant?: DuoTextVariant;
	as?: ElementType;
	muted?: boolean;
	bold?: boolean;
	color?:
		| "primary"
		| "secondary"
		| "accent"
		| "success"
		| "warning"
		| "danger"
		| "default"
		| "muted";
}

const variantMap: Record<
	DuoTextVariant,
	{ tag: ElementType; className: string }
> = {
	h1: {
		tag: "h1",
		className: "text-balance text-3xl font-extrabold tracking-tight md:text-4xl",
	},
	h2: {
		tag: "h2",
		className: "text-balance text-2xl font-bold tracking-tight md:text-3xl",
	},
	h3: {
		tag: "h3",
		className: "text-balance text-xl font-bold md:text-2xl",
	},
	h4: {
		tag: "h4",
		className: "text-balance text-lg font-semibold md:text-xl",
	},
	body: { tag: "p", className: "text-base leading-relaxed" },
	"body-sm": { tag: "p", className: "text-sm leading-relaxed" },
	caption: { tag: "span", className: "text-xs leading-normal" },
	label: {
		tag: "span",
		className: "text-sm font-bold uppercase tracking-wider",
	},
	overline: {
		tag: "span",
		className: "text-xs font-bold uppercase tracking-widest",
	},
};

const colorMap: Record<string, string> = {
	primary: "text-[var(--duo-primary)]",
	secondary: "text-[var(--duo-secondary)]",
	accent: "text-[var(--duo-accent)]",
	success: "text-[var(--duo-success)]",
	warning: "text-[var(--duo-warning)]",
	danger: "text-[var(--duo-danger)]",
	default: "text-[var(--duo-fg)]",
	muted: "text-[var(--duo-fg-muted)]",
};

export function DuoText({
	variant = "body",
	as,
	muted = false,
	bold = false,
	color = "default",
	className,
	children,
	...props
}: DuoTextProps) {
	const config = variantMap[variant];
	const Tag = as ?? config.tag;

	return (
		<Tag
			className={cn(
				config.className,
				muted ? "text-[var(--duo-fg-muted)]" : colorMap[color],
				bold && "font-bold",
				className,
			)}
			{...props}
		>
			{children}
		</Tag>
	);
}
