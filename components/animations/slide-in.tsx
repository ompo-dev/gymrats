"use client";

import { motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

interface SlideInProps {
	children: ReactNode;
	direction?: "up" | "down" | "left" | "right";
	delay?: number;
	duration?: number;
	className?: string;
}

export function SlideIn({
	children,
	direction = "up",
	delay = 0,
	duration = 0.4,
	className = "",
}: SlideInProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const variants = {
		up: { y: 20, x: 0 },
		down: { y: -20, x: 0 },
		left: { x: 20, y: 0 },
		right: { x: -20, y: 0 },
	};

	// No SSR, usar div normal. No cliente após mount, usar motion.div
	const Component = isMounted ? motion.div : "div";

	return (
		<Component
			{...(isMounted
				? {
						initial: { opacity: 0, ...variants[direction] },
						animate: { opacity: 1, x: 0, y: 0 },
						transition: { duration, delay, ease: [0.4, 0, 0.2, 1] },
					}
				: {})}
			className={className}
			suppressHydrationWarning
		>
			{children}
		</Component>
	);
}
