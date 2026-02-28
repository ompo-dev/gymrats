"use client";

import { GripVertical, Loader2, Moon, Plus, Sparkles, Trash2 } from "lucide-react";
import { DuoButton, DuoCard } from "@/components/duo";
import type { PlanSlotData } from "@/lib/types";

export const DAY_NAMES_WEEKLY = [
	"Segunda",
	"Terça",
	"Quarta",
	"Quinta",
	"Sexta",
	"Sábado",
	"Domingo",
] as const;

export interface WeeklyPlanSlotRowProps {
	slot: PlanSlotData;
	loadingSlotId: string | null;
	onAddWorkout: (slotId: string, dayName: string) => void;
	onOpenChat: (slotId: string) => void;
	onEditWorkout: (workoutId: string) => void;
	onRemoveWorkout: (slotId: string) => void;
}

export function WeeklyPlanSlotRow({
	slot,
	loadingSlotId,
	onAddWorkout,
	onOpenChat,
	onEditWorkout,
	onRemoveWorkout,
}: WeeklyPlanSlotRowProps) {
	const dayName = DAY_NAMES_WEEKLY[slot.dayOfWeek] ?? "—";

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<div className="h-px flex-1 bg-duo-border" />
				<span className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider px-2">
					{dayName}
				</span>
				<div className="h-px flex-1 bg-duo-border" />
			</div>
			{slot.type === "rest" ? (
				<DuoCard.Root
					variant="default"
					padding="md"
					className="bg-duo-gray/5 border-dashed"
				>
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-2 text-duo-fg-muted">
							<Moon className="h-5 w-5" />
							<span className="text-sm font-medium">Descanso</span>
						</div>
						<div className="flex items-center gap-2">
							<DuoButton
								variant="secondary"
								size="sm"
								onClick={() => onAddWorkout(slot.id, dayName)}
								disabled={loadingSlotId === slot.id}
							>
								{loadingSlotId === slot.id ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Plus className="h-4 w-4" />
								)}
								Treino
							</DuoButton>
							<DuoButton
								variant="ghost"
								size="sm"
								onClick={() => onOpenChat(slot.id)}
								className="gap-1"
							>
								<Sparkles className="h-4 w-4" />
								Chat IA
							</DuoButton>
						</div>
					</div>
				</DuoCard.Root>
			) : slot.workout ? (
				<DuoCard.Root
					variant="highlighted"
					className="group hover:border-duo-green/50 transition-colors bg-duo-bg-card"
				>
					<div className="flex items-center gap-4">
						<div className="flex-none cursor-grab active:cursor-grabbing text-duo-fg-muted hover:text-duo-green transition-colors">
							<GripVertical className="h-5 w-5" />
						</div>
						<div className="flex-none flex items-center justify-center w-10 h-10 rounded-2xl bg-duo-green/10 text-duo-green font-bold text-lg">
							{slot.dayOfWeek + 1}
						</div>
						<div
							className="flex-1 min-w-0 cursor-pointer"
							onClick={() => onEditWorkout(slot.workout!.id)}
						>
							<h4 className="font-bold text-duo-text truncate text-lg">
								{slot.workout.title}
							</h4>
							<p className="text-sm text-duo-fg-muted truncate">
								{slot.workout.exercises?.length ?? 0} exercícios •{" "}
								{slot.workout.muscleGroup || "-"}
							</p>
						</div>
						<div className="flex items-center gap-2 z-10 relative">
							<DuoButton
								variant="ghost"
								size="icon"
								className="text-duo-fg-muted hover:text-duo-green hover:bg-duo-green/10"
								onClick={(e) => {
									e.stopPropagation();
									onOpenChat(slot.id);
								}}
								title="Chat IA - Editar este dia"
							>
								<Sparkles className="h-4 w-4" />
							</DuoButton>
							<DuoButton
								variant="ghost"
								size="icon"
								className="text-duo-fg-muted hover:text-duo-danger hover:bg-duo-danger/10"
								onClick={(e) => {
									e.stopPropagation();
									onRemoveWorkout(slot.id);
								}}
								title="Remover dia de treino"
							>
								<Trash2 className="h-5 w-5" />
							</DuoButton>
						</div>
					</div>
				</DuoCard.Root>
			) : null}
		</div>
	);
}
