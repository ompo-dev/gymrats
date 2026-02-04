"use client";

import { Dumbbell, Lock, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";
import { Button } from "@/components/atoms/buttons/button";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { CreateUnitModal } from "@/components/organisms/modals/create-unit-modal";
import { EditUnitModal } from "@/components/organisms/modals/edit-unit-modal";
import { WorkoutNode } from "@/components/organisms/workout/workout-node";
import { UnitSectionCard } from "@/components/ui/unit-section-card";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState, useModalStateWithParam } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import type { Unit, WorkoutSession } from "@/lib/types";
import { useWorkoutStore } from "@/stores/workout-store";
import { StaggerContainer } from "../../../components/animations/stagger-container";
import { StaggerItem } from "../../../components/animations/stagger-item";

interface LearningPathProps {
	onLessonSelect: (lessonId: string) => void;
}

export function LearningPath({ onLessonSelect }: LearningPathProps) {
	const _router = useRouter();
	const workoutModal = useModalStateWithParam("workout", "workoutId");
	const [, setExerciseIndexParam] = useQueryState(
		"exerciseIndex",
		parseAsInteger,
	);

	// Carregamento prioritizado: units e progress aparecem primeiro
	// Se dados já existem no store, só carrega o que falta
	useLoadPrioritized({ context: "learn" });

	// Usar hook unificado - fonte única da verdade
	// Dados são carregados automaticamente pelo useStudentInitializer no layout
	const units = useStudent("units");
	const { loadWorkouts } = useStudent("loaders");

	// Recarregar units quando um workout é completado (optimistic update já feito)
	// Isso atualiza o status locked/completed dos workouts no backend
	useEffect(() => {
		const handleWorkoutCompleted = async (event: Event) => {
			const customEvent = event as CustomEvent<{ workoutId?: string }>;
			const { workoutId } = customEvent.detail || {};

			if (!workoutId) return;

			console.log("[DEBUG] Workout completado, recarregando units:", workoutId);

			// Marcar como completo no store local imediatamente (optimistic update)
			const store = useWorkoutStore.getState();
			store.completeWorkout(workoutId);

			// Recarregar units do store unificado para sincronizar com backend
			// Isso atualiza o status locked/completed dos workouts
			// Forçar carregamento mesmo se loadAll estiver em progresso
			try {
				await loadWorkouts(true); // force = true para garantir atualização
				console.log("[DEBUG] Units recarregados após completar workout");
			} catch (error) {
				console.error("[DEBUG] Erro ao recarregar units:", error);
			}
		};

		window.addEventListener("workoutCompleted", handleWorkoutCompleted);

		return () => {
			window.removeEventListener("workoutCompleted", handleWorkoutCompleted);
		};
	}, [loadWorkouts]);

	const createUnitModal = useModalState("create-unit");
	const editUnitModal = useModalStateWithParam("editUnit", "unitId");

	// IMPORTANTE: Com optimistic update, quando createUnit é chamado,
	// o store atualiza instantaneamente (linha 1735-1740 do store),
	// fazendo com que `units` seja atualizado automaticamente via useStudent("units")
	// que está conectado ao seletor específico do store (linha 131 do use-student.ts).
	// Isso faz o componente re-renderizar e o empty state desaparecer IMEDIATAMENTE,
	// sem esperar resposta do servidor (200 OK).

	const handleWorkoutClick = (
		workoutId: string,
		isLocked: boolean, // Recebe isLocked calculado do WorkoutNode
		workoutType?: string,
		exerciseIndex?: number,
	) => {
		// Debug: verificar se está bloqueado
		console.log("[DEBUG] handleWorkoutClick:", {
			workoutId,
			isLocked,
			workoutType,
			exerciseIndex,
		});

		// Se está bloqueado (calculado pelo WorkoutNode), não abrir
		if (isLocked) {
			console.log(
				"[DEBUG] Workout está bloqueado (calculado pelo WorkoutNode), não abrindo modal",
			);
			return;
		}

		console.log("[DEBUG] Abrindo workout:", workoutId);

		// Para qualquer tipo de treino (cardio ou strength), abre o modal
		// O modal correto será renderizado baseado no tipo
		if (workoutModal.paramValue === workoutId) {
			// Se já está aberto, fechar primeiro e depois reabrir
			workoutModal.close();
			// Usar setTimeout para garantir que o estado seja atualizado
			setTimeout(() => {
				workoutModal.open(workoutId);
				if (exerciseIndex !== undefined) {
					setExerciseIndexParam(exerciseIndex);
				}
				onLessonSelect(workoutId);
			}, 0);
		} else {
			workoutModal.open(workoutId);
			if (exerciseIndex !== undefined) {
				setExerciseIndexParam(exerciseIndex);
			}
			onLessonSelect(workoutId);
		}
	};

	const handleEditUnit = (unit: Unit) => {
		// Apenas abrir o modal, sem clonagem
		editUnitModal.open(unit.id);
	};

	// Empty state: quando não há units (após carregar), mostrar opção para criar primeiro treino
	// Verificar se units é um array vazio (não undefined/null que indica carregamento)
	const hasUnits = Array.isArray(units) && units.length > 0;

	if (!hasUnits) {
		return (
			<>
				<EmptyWorkoutState
					onCreateUnit={() => {
						// Abrir modal de criar unit
						createUnitModal.open();
					}}
				/>
				{/* Modais para empty state */}
				{createUnitModal.isOpen && (
					<CreateUnitModal
						onClose={createUnitModal.close}
						onUnitCreated={(unitId) => {
							// Após criar unit, abrir modal de edição para adicionar workouts
							editUnitModal.open(unitId);
						}}
					/>
				)}
				{editUnitModal.isOpen && editUnitModal.paramValue && <EditUnitModal />}
			</>
		);
	}

	return (
		<div className="relative mx-auto max-w-2xl py-8">
			{units.map((unit: Unit, unitIndex: number) => {
				return (
					<motion.div
						key={unit.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: unitIndex * 0.1, duration: 0.4 }}
						className="mb-12"
					>
						{/* Unit Header - Estilo Duolingo */}
						<div className="mb-8">
							<UnitSectionCard
								sectionLabel={unit.title}
								title={unit.description}
								onButtonClick={() => handleEditUnit(unit)}
							/>
						</div>

						{/* Workouts Path - Sem linhas de conexão */}
						<StaggerContainer className="relative flex flex-col items-center space-y-6">
							{unit.workouts.map(
								(workout: WorkoutSession, workoutIndex: number) => {
									const isFirstInUnit = workoutIndex === 0;
									// Pegar todos os workouts anteriores:
									// 1. Todos os workouts de unidades anteriores
									// 2. Workouts anteriores na mesma unidade
									const previousUnitsWorkouts = units
										.slice(0, unitIndex)
										.flatMap((u: Unit) => u.workouts);
									const previousWorkoutsInSameUnit = unit.workouts.slice(
										0,
										workoutIndex,
									);
									const _previousWorkouts = [
										...previousUnitsWorkouts,
										...previousWorkoutsInSameUnit,
									];

									const positions = [
										"center",
										"left",
										"right",
										"center",
										"left",
										"right",
									];
									const position = positions[workoutIndex % positions.length] as
										| "left"
										| "center"
										| "right";

									return (
										<StaggerItem key={workout.id} className="relative w-full">
											<WorkoutNode
												workout={workout}
												position={position}
												onClick={(isLocked) => {
													// WorkoutNode passa isLocked calculado (considera estado otimista)
													// handleWorkoutClick usa esse valor para decidir se abre o modal
													handleWorkoutClick(
														workout.id,
														isLocked,
														workout.type,
													);
												}}
												isFirst={isFirstInUnit}
												previousWorkouts={previousWorkoutsInSameUnit}
												previousUnitsWorkouts={previousUnitsWorkouts}
											/>
										</StaggerItem>
									);
								},
							)}
						</StaggerContainer>
					</motion.div>
				);
			})}

			{/* Treasure chest at the end - Duolingo style */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3, duration: 0.4 }}
				className="mt-12 flex justify-center"
			>
				<motion.div
					whileHover={{ scale: 1.05 }}
					transition={{ duration: 0.2 }}
					className="flex flex-col items-center gap-3"
				>
					<div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-duo-gray bg-white shadow-md">
						<Lock className="h-10 w-10 text-duo-gray-dark" />
					</div>
					<p className="text-sm font-bold text-duo-gray-dark">
						Continue praticando para desbloquear!
					</p>
				</motion.div>
			</motion.div>

			{/* Modais */}
			{createUnitModal.isOpen && (
				<CreateUnitModal
					onClose={createUnitModal.close}
					onUnitCreated={(unitId) => {
						// Após criar unit, abrir modal de edição para adicionar workouts
						editUnitModal.open(unitId);
					}}
				/>
			)}
			{editUnitModal.isOpen && editUnitModal.paramValue && <EditUnitModal />}
		</div>
	);
}

/**
 * Empty State quando não há treinos criados
 *
 * Exatamente igual ao padrão do NutritionTracker (refeições)
 * SectionCard com ícone no header e título no header
 * Dentro: ícone grande → título → texto motivacional → botão
 *
 * IMPORTANTE: Com optimistic update, quando o usuário cria um unit,
 * o store atualiza instantaneamente e este componente re-renderiza,
 * fazendo o empty state desaparecer imediatamente sem esperar resposta do servidor.
 */
function EmptyWorkoutState({ onCreateUnit }: { onCreateUnit: () => void }) {
	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="mb-2 text-3xl font-bold text-duo-text">Treinos</h1>
				<p className="text-sm text-duo-gray-dark">
					Crie e acompanhe seus treinos personalizados
				</p>
			</div>

			<SectionCard icon={Dumbbell} title="Meus Treinos">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1, type: "spring" }}
					className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
				>
					<Dumbbell className="h-12 w-12 text-duo-green" />
					<p className="text-lg font-bold text-gray-900">
						Comece a criar seus treinos!
					</p>
					<p className="text-sm text-gray-600">
						Crie seu plano personalizado com units, dias de treino e exercícios.
						Você tem controle total sobre seu treino e pode acompanhar seu
						progresso.
					</p>
					<Button onClick={onCreateUnit} variant="default" className="w-fit">
						<Plus className="h-4 w-4 mr-2" />
						Criar Primeiro Plano
					</Button>
				</motion.div>
			</SectionCard>
		</div>
	);
}
