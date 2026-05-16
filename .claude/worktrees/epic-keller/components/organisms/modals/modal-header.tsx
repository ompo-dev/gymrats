"use client";

import { ArrowLeft, X } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface ModalHeaderProps {
	title: string;
	onClose: () => void;
	onBack?: () => void;
	children?: ReactNode;
}

export function ModalHeader({
	title,
	onClose,
	onBack,
	children,
}: ModalHeaderProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.1, duration: 0.3 }}
			className="border-b-2 border-gray-300 p-6"
		>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					{onBack && (
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.9 }}
							onClick={onBack}
							className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
						>
							<ArrowLeft className="h-5 w-5" />
						</motion.button>
					)}
					<h2 className="text-2xl font-bold text-gray-900">{title}</h2>
				</div>
				<motion.button
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
					onClick={onClose}
					className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
				>
					<X className="h-5 w-5" />
				</motion.button>
			</div>
			{children}
		</motion.div>
	);
}
