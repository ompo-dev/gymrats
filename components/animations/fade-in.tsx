"use client";

import { motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

interface FadeInProps {
	children: ReactNode;
	delay?: number;
	duration?: number;
	className?: string;
}

export function FadeIn({
	children,
	delay = 0,
	duration = 0.4,
	className = "",
}: FadeInProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// No SSR, usar div normal. No cliente após mount, usar motion.div
	const Component = isMounted ? motion.div : "div";

	return (
		<Component
			{...(isMounted
				? {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
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
