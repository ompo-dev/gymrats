"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DuoButton } from "@/components/duo";

export interface WeightModalProps {
	isOpen: boolean;
	onClose: () => void;
	newWeight: string;
	onNewWeightChange: (value: string) => void;
	currentWeight: number | null;
	onSave: () => void;
}

export function WeightModal({
	isOpen,
	onClose,
	newWeight,
	onNewWeightChange,
	currentWeight,
	onSave,
}: WeightModalProps) {
	const isValid = newWeight && !Number.isNaN(parseFloat(newWeight));

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
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
						className="w-full max-w-md rounded-t-3xl bg-duo-bg-card sm:rounded-3xl"
						onClick={(e) => e.stopPropagation()}
					>
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1, duration: 0.3 }}
							className="border-b-2 border-duo-border p-6"
						>
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-2xl font-bold text-duo-text">
									Atualizar Peso
								</h2>
								<DuoButton
									type="button"
									variant="ghost"
									size="icon"
									onClick={onClose}
									className="h-10 w-10 rounded-full"
								>
									<X className="h-5 w-5" />
								</DuoButton>
							</div>

							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.15, duration: 0.3 }}
								className="space-y-4"
							>
								<div className="space-y-2">
									<label
										htmlFor="weight"
										className="block text-sm font-bold text-duo-fg-muted"
									>
										Peso Atual (kg)
									</label>
									<input
										id="weight"
										type="number"
										step="0.1"
										min="0"
										value={newWeight}
										onChange={(e) => onNewWeightChange(e.target.value)}
										placeholder="Ex: 91.5"
										className="w-full rounded-xl border-2 border-duo-border py-3 px-4 font-bold text-duo-text placeholder:text-duo-fg-muted focus:border-duo-green focus:outline-none text-lg"
									/>
									<p className="text-xs text-duo-fg-muted">
										Digite seu peso atual em quilogramas
									</p>
								</div>

								<AnimatePresence>
									{currentWeight && (
										<motion.div
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.95 }}
											transition={{ delay: 0.2, duration: 0.3 }}
											className="rounded-xl border-2 border-duo-border bg-duo-bg-elevated p-4"
										>
											<p className="text-sm text-duo-fg-muted">
												Peso anterior:{" "}
												<span className="font-bold text-duo-text">
													{currentWeight.toFixed(1)}kg
												</span>
											</p>
											{newWeight &&
												isValid &&
												parseFloat(newWeight) !== currentWeight && (
													<motion.p
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														className="text-sm mt-2 font-bold"
													>
														{parseFloat(newWeight) > currentWeight ? (
															<span className="text-duo-blue">
																Ganho: +
																{(
																	parseFloat(newWeight) - currentWeight
																).toFixed(1)}
																kg
															</span>
														) : (
															<span className="text-duo-green">
																Perda:{" "}
																{(
																	parseFloat(newWeight) - currentWeight
																).toFixed(1)}
																kg
															</span>
														)}
													</motion.p>
												)}
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							transition={{ duration: 0.3 }}
							className="border-t-2 border-duo-border p-6"
						>
							<div className="flex gap-3">
								<DuoButton
									onClick={onClose}
									variant="white"
									className="flex-1"
								>
									Cancelar
								</DuoButton>
								<DuoButton
									onClick={onSave}
									disabled={!isValid}
									className="flex-1"
								>
									Salvar
								</DuoButton>
							</div>
						</motion.div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
