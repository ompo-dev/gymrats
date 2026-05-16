"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface StaggerContainerProps {
	children: ReactNode;
	className?: string;
	staggerDelay?: number;
}

export function StaggerContainer({
	children,
	className = "",
	staggerDelay = 0.1,
}: StaggerContainerProps) {
	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={{
				visible: {
					transition: {
						staggerChildren: staggerDelay,
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}
