"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface WhileInViewProps {
	children: ReactNode;
	className?: string;
	delay?: number;
	once?: boolean;
}

export function WhileInView({
	children,
	className = "",
	delay = 0,
	once = true,
}: WhileInViewProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{ opacity: 1, y: 0 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once, margin: "-100px" }}
			transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
