"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DuoButton } from "@/components/duo";
import { DuoSelect } from "@/components/duo";
import type { DietType } from "@/lib/types";

interface AddMealModalProps {
	onClose: () => void;
	onAddMeal: (
		mealsData: Array<{
			name: string;
			type: DietType | "afternoon-snack" | "pre-workout" | "post-workout";
			time: string;
		}>,
	) => void;
}

const mealTypes = [
	{ id: "breakfast", label: "Café da Manhã", icon: "🍳", defaultTime: "08:00" },
	{ id: "lunch", label: "Almoço", icon: "🍽️", defaultTime: "12:30" },
	{ id: "dinner", label: "Jantar", icon: "🌙", defaultTime: "19:30" },
	{
		id: "afternoon-snack",
		label: "Café da Tarde",
		icon: "☕",
		defaultTime: "15:00",
	},
	{ id: "pre-workout", label: "Pré Treino", icon: "💪", defaultTime: "17:00" },
	{ id: "post-workout", label: "Pós Treino", icon: "🏋️", defaultTime: "18:30" },
] as const;

export function AddMealModal({ onClose, onAddMeal }: AddMealModalProps) {
	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [times, setTimes] = useState<Record<string, string>>({});

	const handleTypeChange = (typeId: string) => {
		setSelectedTypes((prev) => {
			if (prev.includes(typeId)) {
				// Remove o tipo selecionado
				const newSelected = prev.filter((id) => id !== typeId);
				const newTimes = { ...times };
				delete newTimes[typeId];
				setTimes(newTimes);
				return newSelected;
			} else {
				// Adiciona o tipo selecionado
				const mealType = mealTypes.find((m) => m.id === typeId);
				if (mealType) {
					setTimes((prev) => ({ ...prev, [typeId]: mealType.defaultTime }));
				}
				return [...prev, typeId];
			}
		});
	};

	const handleTimeChange = (typeId: string, time: string) => {
		setTimes((prev) => ({ ...prev, [typeId]: time }));
	};

	const handleAddMeals = () => {
		const mealsToAdd = selectedTypes
			.map((typeId) => {
				const mealType = mealTypes.find((m) => m.id === typeId);
				if (!mealType) return null;
				return {
					name: mealType.label,
					type: typeId as
						| DietType
						| "afternoon-snack"
						| "pre-workout"
						| "post-workout",
					time: times[typeId] || mealType.defaultTime,
				};
			})
			.filter(Boolean) as Array<{
			name: string;
			type: DietType | "afternoon-snack" | "pre-workout" | "post-workout";
			time: string;
		}>;

		if (mealsToAdd.length === 0) return;

		onAddMeal(mealsToAdd);
		onClose();
	};

	const selectedCount = selectedTypes.length;

	const options = mealTypes.map((mealType) => ({
		value: mealType.id,
		label: mealType.label,
		emoji: mealType.icon,
	}));

	return (
		<AnimatePresence>
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
					className="w-full max-w-2xl rounded-t-3xl bg-duo-bg-card sm:rounded-3xl"
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
								Adicionar Refeição
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
							className="mb-4"
						>
							<DuoSelect
								options={options}
								value={selectedTypes}
								onChange={handleTypeChange}
								multiple
								placeholder="Selecione as refeições"
							/>
						</motion.div>

						<AnimatePresence>
							{selectedCount > 0 && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									transition={{ duration: 0.3 }}
									className="mt-4 space-y-3"
								>
									<label className="block text-sm font-bold text-duo-fg-muted">
										Horários das Refeições Selecionadas
									</label>
									<div className="space-y-2">
										{selectedTypes.map((typeId, index) => {
											const mealType = mealTypes.find((m) => m.id === typeId);
											if (!mealType) return null;
											return (
												<motion.div
													key={typeId}
													initial={{ opacity: 0, y: -10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ delay: index * 0.05 }}
													className="flex items-center gap-3 rounded-xl border-2 border-duo-border bg-duo-bg-elevated p-3"
												>
													<span className="text-xl">{mealType.icon}</span>
													<div className="flex-1">
														<div className="text-xs font-bold text-duo-text">
															{mealType.label}
														</div>
													</div>
													<input
														type="time"
														value={times[typeId] || mealType.defaultTime}
														onChange={(e) =>
															handleTimeChange(typeId, e.target.value)
														}
														className="rounded-lg border-2 border-duo-border px-3 py-1.5 text-sm font-bold text-duo-text focus:border-duo-green focus:outline-none bg-duo-bg-card"
													/>
												</motion.div>
											);
										})}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>

					<AnimatePresence>
						{selectedCount > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ duration: 0.3 }}
								className="border-t-2 border-duo-border p-6"
							>
								<DuoButton onClick={handleAddMeals} variant="primary" className="w-full">
									ADICIONAR {selectedCount} REFEIÇÃO
									{selectedCount > 1 ? "ÕES" : ""}
								</DuoButton>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
