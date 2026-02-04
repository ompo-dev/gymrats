"use client";

import { Dumbbell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { useStudent } from "@/hooks/use-student";
import { useStudentUnifiedStore } from "@/stores/student-unified-store";

interface CreateUnitModalProps {
	onClose: () => void;
	onUnitCreated?: (unitId: string) => void;
}

/**
 * Modal para criar primeiro treino (Unit)
 *
 * Similar ao AddMealModal, mas para criar um plano de treino
 */
export function CreateUnitModal({
	onClose,
	onUnitCreated,
}: CreateUnitModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const { createUnit } = useStudent("actions");

	const handleCreateUnit = async () => {
		if (!title.trim()) {
			toast.error("O nome do plano é obrigatório");
			return;
		}

		setIsCreating(true);

		try {
			// Criar unit via store (optimistic update instantâneo - UI já atualiza!)
			// Não espera resposta do servidor - atualização é imediata no store
			await createUnit({
				title: title.trim(),
				description: description.trim() || undefined,
			});

			// Optimistic update já aconteceu - store já tem o unit
			// Buscar unit criado pelo título (tem ID temporário do command)
			const units = useStudentUnifiedStore.getState().data.units;
			const createdUnit = units.find((u: any) => u.title === title.trim());

			toast.success("Plano de treino criado com sucesso!");

			// Fechar modal imediatamente (não precisa esperar resposta do servidor)
			onClose();

			// Se callback fornecido, chamar com ID temporário imediatamente
			// O EditUnitModal funcionará com ID temporário, e quando o servidor responder,
			// o ID será atualizado automaticamente no store
			if (onUnitCreated && createdUnit) {
				// Usar setTimeout apenas para garantir que o modal fechou antes de abrir outro
				setTimeout(() => {
					onUnitCreated(createdUnit.id);
				}, 100);
			}

			// A requisição ao backend acontece em paralelo via syncManager
			// Não precisa aguardar - optimistic update já fez a UI atualizar
		} catch (error: any) {
			console.error("Erro ao criar plano de treino:", error);
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Erro ao criar plano de treino. Tente novamente.";
			toast.error(errorMessage);
		} finally {
			setIsCreating(false);
		}
	};

	const canCreate = title.trim().length > 0 && !isCreating;

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
					className="w-full max-w-2xl rounded-t-3xl bg-white sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shrink-0"
					onClick={(e) => e.stopPropagation()}
				>
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.3 }}
						className="border-b-2 border-gray-300 p-6 shrink-0"
					>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-2xl font-bold text-gray-900">
								Criar Primeiro Treino
							</h2>
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								onClick={onClose}
								className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
							>
								<X className="h-5 w-5" />
							</motion.button>
						</div>

						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.15, duration: 0.3 }}
							className="space-y-4"
						>
							<div>
								<label className="block text-sm font-bold text-gray-600 mb-2">
									Nome do Plano
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Ex: Treino de Hipertrofia"
									className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-50 focus:outline-none focus:border-duo-green focus:bg-white transition-all font-bold text-lg"
									disabled={isCreating}
								/>
								<p className="text-xs text-gray-500 mt-1">
									Ex: Treino ABC, Treino Push/Pull/Legs, Treino Full Body
								</p>
							</div>

							<div>
								<label className="block text-sm font-bold text-gray-600 mb-2">
									Descrição (Opcional)
								</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Descreva o objetivo deste plano de treino..."
									rows={3}
									className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-50 focus:outline-none focus:border-duo-green focus:bg-white transition-all resize-none"
									disabled={isCreating}
								/>
							</div>

							<DuoCard
								variant="default"
								className="bg-duo-green/5 border-2 border-duo-green/20 p-4"
							>
								<div className="flex items-start gap-3">
									<div className="rounded-xl bg-duo-green/10 p-3 shrink-0">
										<Dumbbell className="h-6 w-6 text-duo-green" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-bold text-gray-900 mb-1">
											Após criar o plano, você poderá:
										</p>
										<ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
											<li>Adicionar dias de treino (workouts)</li>
											<li>Adicionar exercícios a cada dia</li>
											<li>Personalizar séries, repetições e descanso</li>
											<li>Acompanhar seu progresso</li>
										</ul>
									</div>
								</div>
							</DuoCard>
						</motion.div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.3 }}
						className="border-t-2 border-gray-300 p-6 shrink-0"
					>
						<div className="flex gap-3">
							<Button
								onClick={onClose}
								variant="outline"
								className="flex-1"
								disabled={isCreating}
							>
								Cancelar
							</Button>
							<Button
								onClick={handleCreateUnit}
								className="flex-1 bg-duo-green hover:bg-duo-green-dark"
								disabled={!canCreate}
							>
								{isCreating ? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
										Criando...
									</>
								) : (
									"CRIAR PLANO"
								)}
							</Button>
						</div>
					</motion.div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
