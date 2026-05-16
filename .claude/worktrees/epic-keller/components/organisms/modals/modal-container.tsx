"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

interface ModalContainerProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	maxWidth?: string;
	zIndex?: string;
}

export function ModalContainer({
	isOpen,
	onClose,
	children,
	maxWidth = "max-w-2xl",
	zIndex = "z-60",
}: ModalContainerProps) {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className={`fixed inset-0 ${zIndex} flex items-end justify-center bg-black/50 sm:items-center`}
					onClick={onClose}
				>
					<motion.div
						initial={{ y: "100%", opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: "100%", opacity: 0 }}
						transition={{
							type: "spring",
							damping: 25,
							stiffness: 300,
							duration: 0.3,
						}}
						className={`w-full ${maxWidth} rounded-t-3xl bg-white sm:rounded-3xl sm:scale-100`}
						onClick={(e) => e.stopPropagation()}
						style={{
							maxHeight: "90vh",
							display: "flex",
							flexDirection: "column",
						}}
					>
						{children}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
