"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface CardioConfigModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectPreference: (
		preference: "none" | "before" | "after",
		duration?: number,
	) => void;
}

export function CardioConfigModal({
	isOpen,
	onClose,
	onSelectPreference,
}: CardioConfigModalProps) {
	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.3 }}
				className="absolute inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						onClose();
					}
				}}
			>
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					transition={{ duration: 0.3 }}
					onClick={(e) => e.stopPropagation()}
					className="relative w-full max-w-md mx-4 rounded-3xl border-2 border-duo-border bg-white p-6 sm:p-8 shadow-2xl"
				>
					<button
						onClick={onClose}
						className="absolute right-4 top-4 rounded-xl p-2 transition-colors hover:bg-gray-100"
					>
						<X className="h-5 w-5 text-duo-gray-dark" />
					</button>

					<div className="mb-6 text-center">
						<div className="mb-4 text-6xl">🏃‍♂️</div>
						<h2 className="mb-2 text-2xl font-black text-duo-text">
							Adicionar Cardio?
						</h2>
						<p className="text-sm text-duo-gray-dark">
							Escolha quando fazer cardio hoje
						</p>
					</div>

					<div className="space-y-3">
						{/* Não fazer cardio */}
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => {
								onSelectPreference("none", undefined);
								onClose();
							}}
							className="w-full rounded-2xl border-2 border-duo-border bg-white p-4 text-left transition-all hover:border-duo-gray hover:bg-gray-50"
						>
							<div className="flex items-center gap-3">
								<div className="text-2xl">❌</div>
								<div className="flex-1">
									<div className="font-bold text-duo-text">
										Não Fazer Cardio
									</div>
									<div className="text-sm text-duo-gray-dark">
										Apenas treino de força hoje
									</div>
								</div>
							</div>
						</motion.button>

						{/* Cardio ANTES */}
						<div className="space-y-2">
							<div className="text-sm font-bold text-duo-text">
								⏱️ Cardio ANTES do Treino
							</div>
							<div className="grid grid-cols-4 gap-2">
								{[5, 10, 15, 20].map((duration) => (
									<motion.button
										key={`before-${duration}`}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => {
											onSelectPreference("before", duration);
											onClose();
										}}
										className="rounded-xl border-2 border-duo-blue bg-duo-blue/10 p-3 text-center transition-all hover:bg-duo-blue/20"
									>
										<div className="text-xl font-black text-duo-blue">
											{duration}
										</div>
										<div className="text-xs text-duo-gray-dark">min</div>
									</motion.button>
								))}
							</div>
						</div>

						{/* Cardio DEPOIS */}
						<div className="space-y-2">
							<div className="text-sm font-bold text-duo-text">
								⏱️ Cardio DEPOIS do Treino
							</div>
							<div className="grid grid-cols-4 gap-2">
								{[5, 10, 15, 20].map((duration) => (
									<motion.button
										key={`after-${duration}`}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => {
											onSelectPreference("after", duration);
											onClose();
										}}
										className="rounded-xl border-2 border-duo-orange bg-duo-orange/10 p-3 text-center transition-all hover:bg-duo-orange/20"
									>
										<div className="text-xl font-black text-duo-orange">
											{duration}
										</div>
										<div className="text-xs text-duo-gray-dark">min</div>
									</motion.button>
								))}
							</div>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
