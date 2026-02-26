"use client";

import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DuoButton } from "@/components/duo";

interface DeleteConfirmationModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	title: string;
	message: string;
}

export function DeleteConfirmationModal({
	isOpen,
	onConfirm,
	onCancel,
	title,
	message,
}: DeleteConfirmationModalProps) {
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 sm:items-center"
					onClick={onCancel}
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
						className="w-full max-w-sm rounded-t-3xl bg-[var(--duo-bg-card)] sm:rounded-3xl p-6 shadow-xl space-y-4 border border-[var(--duo-border)]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="text-center">
							<div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
								<Trash2 className="h-6 w-6 text-red-500" />
							</div>
							<h3 className="text-lg font-bold text-[var(--duo-fg)]">{title}</h3>
							<p className="text-sm text-[var(--duo-fg-muted)] mt-1">{message}</p>
						</div>
						<div className="flex gap-3">
							<DuoButton
								variant="outline"
								className="flex-1 font-bold"
								onClick={onCancel}
							>
								Cancelar
							</DuoButton>
							<DuoButton onClick={onConfirm} variant="danger">
								Remover
							</DuoButton>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
