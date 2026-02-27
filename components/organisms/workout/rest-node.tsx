"use client";

import { Moon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface RestNodeProps {
	dayOfWeek: number;
	position?: "left" | "center" | "right";
}

export function RestNode({
	dayOfWeek,
	position = "center",
}: RestNodeProps) {
	const dayName = DAY_NAMES[dayOfWeek] ?? "?";

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className={cn(
				"flex w-full items-center justify-center",
				position === "left" && "justify-start pl-4",
				position === "right" && "justify-end pr-4",
			)}
		>
			<div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-duo-gray bg-duo-gray/5 px-6 py-4">
				<Moon className="h-8 w-8 text-duo-gray" aria-hidden />
				<span className="text-sm font-medium text-duo-gray-dark">
					{dayName} - Descanso
				</span>
			</div>
		</motion.div>
	);
}
