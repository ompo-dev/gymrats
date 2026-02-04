"use client";

import { motion } from "motion/react";

interface EndOfListStateProps {
	total: number;
	itemName?: string;
}

export function EndOfListState({
	total,
	itemName = "itens",
}: EndOfListStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="py-4 text-center text-xs text-gray-500"
		>
			Todos os {itemName} foram carregados ({total} total)
		</motion.div>
	);
}
