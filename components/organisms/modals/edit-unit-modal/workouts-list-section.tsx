"use client";

import { Dumbbell, Plus, Sparkles } from "lucide-react";
import { Reorder } from "motion/react";
import { toast } from "sonner";
import { DuoButton } from "@/components/duo";
import type { PlanSlotData, WorkoutSession } from "@/lib/types";
import { WeeklyPlanSlotRow } from "./weekly-plan-slot-row";
import { WorkoutReorderItem } from "./workout-reorder-item";

const DAY_NAMES = [
	"Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo",
];

export interface WorkoutsListSectionProps {
	isWeeklyPlanMode: boolean;
	weeklyPlan: { id: string } | null;
	planSlots: PlanSlotData[];
	workoutItems: WorkoutSession[];
	loadingSlotId: string | null;
	onChatClick: (slotId: string) => void;
	onAddWorkoutToSlot: (slotId: string, dayName: string) => void;
	onRemoveWorkoutFromSlot: (slotId: string) => void;
	onEditWorkout: (workoutId: string) => void;
	onReorderWorkouts: (newOrder: WorkoutSession[]) => void;
	onCreateWorkout: () => void;
	onDeleteWorkoutClick: (workoutId: string) => void;
	onOpenWorkoutChat: () => void;
}

const btnStyle = { opacity: 1, visibility: "visible" as const, display: "flex", pointerEvents: "auto" as const, zIndex: 10 };

export function WorkoutsListSection(props: WorkoutsListSectionProps) {
	const {
		isWeeklyPlanMode,
		weeklyPlan,
		planSlots,
		workoutItems,
		loadingSlotId,
		onChatClick,
		onAddWorkoutToSlot,
		onRemoveWorkoutFromSlot,
		onEditWorkout,
		onReorderWorkouts,
		onCreateWorkout,
		onDeleteWorkoutClick,
		onOpenWorkoutChat,
	} = props;

	const handleWeeklyChatClick = () => {
		const firstRest = planSlots.find((s) => s.type === "rest");
		if (firstRest) onChatClick(firstRest.id);
	};

	const handleWeeklyAddDayClick = () => {
		const firstRest = planSlots.find((s) => s.type === "rest");
		if (firstRest) {
			onAddWorkoutToSlot(firstRest.id, DAY_NAMES[firstRest.dayOfWeek]);
		} else {
			toast.info("Todos os dias já têm treino.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col md:flex-row items-center justify-between px-1 mb-4">
				<h3 className="text-lg font-bold text-duo-text mb-2 md:mb-0">
					{isWeeklyPlanMode ? "Dias da Semana" : "Dias de Treino"}
				</h3>
				<div className="flex items-center gap-2">
					{isWeeklyPlanMode ? (
						<>
							<DuoButton size="sm" variant="outline" onClick={handleWeeklyChatClick}
								className="border-2 border-duo-green font-bold hover:bg-duo-green/10 text-duo-green flex items-center gap-2 z-10 relative"
								style={btnStyle}>
								<Sparkles className="h-4 w-4" /> Chat
							</DuoButton>
							<DuoButton size="sm" variant="outline" onClick={handleWeeklyAddDayClick}
								className="border-2 font-bold hover:bg-duo-bg-elevated flex items-center gap-2 z-10 relative"
								style={btnStyle}>
								<Plus className="h-4 w-4" /> Adicionar Dia
							</DuoButton>
						</>
					) : (
						<>
							<DuoButton size="sm" variant="outline" onClick={onOpenWorkoutChat}
								className="border-2 border-duo-green font-bold hover:bg-duo-green/10 text-duo-green flex items-center gap-2 z-10 relative"
								style={btnStyle}>
								<Sparkles className="h-4 w-4" /> Chat IA
							</DuoButton>
							<DuoButton size="sm" variant="outline" onClick={onCreateWorkout}
								className="border-2 font-bold hover:bg-duo-bg-elevated flex items-center gap-2 z-10 relative"
								style={btnStyle}>
								<Plus className="h-4 w-4" /> Adicionar Dia
							</DuoButton>
						</>
					)}
				</div>
			</div>

			{isWeeklyPlanMode && weeklyPlan ? (
				<div className="space-y-4">
					{[...planSlots].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((slot) => (
						<WeeklyPlanSlotRow
							key={slot.id}
							slot={slot}
							loadingSlotId={loadingSlotId}
							onAddWorkout={onAddWorkoutToSlot}
							onOpenChat={onChatClick}
							onEditWorkout={onEditWorkout}
							onRemoveWorkout={onRemoveWorkoutFromSlot}
						/>
					))}
				</div>
			) : workoutItems.length > 0 ? (
				<Reorder.Group axis="y" values={workoutItems} onReorder={onReorderWorkouts} className="space-y-3">
					{workoutItems.map((workout, index) => (
						<WorkoutReorderItem
							key={workout.id}
							workout={workout}
							index={index}
							onEdit={onEditWorkout}
							onDelete={onDeleteWorkoutClick}
						/>
					))}
				</Reorder.Group>
			) : (
				<div className="text-center py-12 text-duo-fg-muted bg-duo-bg-card rounded-2xl border-2 border-dashed border-duo-border">
					<div className="w-12 h-12 rounded-full bg-duo-bg-elevated flex items-center justify-center mx-auto mb-3">
						<Dumbbell className="h-6 w-6 text-duo-fg-muted" />
					</div>
					<p className="font-bold">Nenhum dia de treino adicionado</p>
					<p className="text-sm mt-1">Clique em Adicionar Dia para começar</p>
				</div>
			)}
		</div>
	);
}
