"use client";

import { Activity, Calendar, Dumbbell, Moon, Trophy, TrendingUp } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { Loader2 } from "lucide-react";
import type { PlanSlotData, StudentData, WeeklyPlanData } from "@/lib/types";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export interface WorkoutsTabProps {
	student: StudentData;
	weeklyPlan: WeeklyPlanData | null | undefined;
	isLoadingWeeklyPlan: boolean;
}

export function WorkoutsTab({
	student,
	weeklyPlan,
	isLoadingWeeklyPlan,
}: WorkoutsTabProps) {
	return (
		<div className="space-y-6">
			<DuoCard.Root variant="default" padding="md">
				<DuoCard.Header>
					<div className="flex items-center gap-2">
						<Calendar
							className="h-5 w-5 shrink-0"
							style={{ color: "var(--duo-secondary)" }}
							aria-hidden
						/>
						<h2 className="font-bold text-[var(--duo-fg)]">Plano Semanal do Aluno</h2>
					</div>
				</DuoCard.Header>
				{isLoadingWeeklyPlan ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
					</div>
				) : weeklyPlan && weeklyPlan.slots?.length > 0 ? (
					<div className="space-y-4">
						<p className="text-sm text-duo-gray-dark">
							{weeklyPlan.title}
							{weeklyPlan.description && ` • ${weeklyPlan.description}`}
						</p>
						<div className="flex flex-col gap-4">
							{weeklyPlan.slots.map((slot: PlanSlotData) => {
								if (slot.type === "rest" || !slot.workout) {
									return (
										<div key={slot.id} className="flex items-center gap-3">
											<span className="w-16 text-sm font-bold text-duo-gray-dark">
												{DAY_NAMES[slot.dayOfWeek] ?? "—"}
											</span>
											<div className="flex items-center gap-2 rounded-lg bg-duo-gray/20 px-4 py-2">
												<Moon className="h-4 w-4 text-duo-gray" />
												<span className="text-sm font-bold text-duo-gray-dark">
													Descanso
												</span>
											</div>
										</div>
									);
								}
								const w = slot.workout;
								return (
									<div key={slot.id} className="flex items-start gap-3">
										<span className="w-16 shrink-0 pt-1 text-sm font-bold text-duo-gray-dark">
											{DAY_NAMES[slot.dayOfWeek] ?? "—"}
										</span>
										<DuoCard.Root variant="default" size="sm" className="flex-1 p-3">
											<div className="font-bold text-duo-text">{w.title}</div>
											<div className="mt-1 text-xs text-duo-gray-dark">
												{w.estimatedTime} min • {w.muscleGroup}
											</div>
											{w.exercises?.length > 0 && (
												<div className="mt-2 space-y-1 border-t border-duo-border pt-2">
													{w.exercises.slice(0, 5).map((ex: { id: string; name: string }) => (
														<p key={ex.id} className="text-xs text-duo-gray-dark">
															• {ex.name}
														</p>
													))}
													{(w.exercises?.length ?? 0) > 5 && (
														<p className="text-xs text-duo-gray-dark">
															+ {(w.exercises?.length ?? 0) - 5} exercício(s)
														</p>
													)}
												</div>
											)}
										</DuoCard.Root>
									</div>
								);
							})}
						</div>
					</div>
				) : (
					<div className="py-8 text-center">
						<Dumbbell className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
						<p className="font-bold text-duo-gray-dark">
							Aluno ainda não possui plano semanal
						</p>
						<p className="mt-1 text-sm text-duo-gray-dark">
							O plano será exibido aqui quando o aluno criar um no app.
						</p>
					</div>
				)}
			</DuoCard.Root>

			<DuoCard.Root variant="default" padding="md">
				<DuoCard.Header>
					<div className="flex items-center gap-2">
						<Trophy
							className="h-5 w-5 shrink-0"
							style={{ color: "var(--duo-secondary)" }}
							aria-hidden
						/>
						<h2 className="font-bold text-[var(--duo-fg)]">Histórico de Treinos</h2>
					</div>
				</DuoCard.Header>
				{(student.workoutHistory ?? []).length === 0 ? (
					<DuoCard.Root variant="default" size="default" className="p-8 text-center">
						<Dumbbell className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
						<p className="font-bold text-duo-gray-dark">
							Nenhum treino registrado ainda
						</p>
						<p className="mt-1 text-sm text-duo-gray-dark">
							Os treinos do aluno aparecerão aqui assim que forem completados.
						</p>
					</DuoCard.Root>
				) : (
					<div className="space-y-3">
						{(student.workoutHistory ?? []).map((wh, idx) => {
							const exercises = wh.exercises ?? [];
							return (
								<DuoCard.Root
									key={`wh-${idx}-${wh.date?.toISOString?.() ?? idx}`}
									variant="default"
									size="default"
								>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex-1 min-w-0">
											<p className="font-bold text-duo-text text-sm sm:text-base">
												{wh.workoutName || "Treino"}
											</p>
											<p className="text-xs text-duo-gray-dark mt-0.5">
												{wh.date
													? new Date(wh.date).toLocaleDateString("pt-BR")
													: "N/A"}
											</p>
										</div>
										<div className="flex gap-4 text-sm">
											<span className="flex items-center gap-1 text-duo-blue font-bold">
												<Activity className="h-3.5 w-3.5" />
												{wh.duration ?? 0} min
											</span>
											{(wh.totalVolume ?? 0) > 0 && (
												<span className="flex items-center gap-1 text-duo-green font-bold">
													<TrendingUp className="h-3.5 w-3.5" />
													{(wh.totalVolume ?? 0).toFixed(0)} kg
												</span>
											)}
										</div>
									</div>
									{exercises.length > 0 && (
										<div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
											{exercises.slice(0, 3).map((ex) => (
												<p
													key={ex.id ?? ex.exerciseName}
													className="text-xs text-duo-gray-dark"
												>
													• {ex.exerciseName}
												</p>
											))}
											{exercises.length > 3 && (
												<p className="text-xs text-duo-gray-dark">
													e mais {exercises.length - 3} exercício(s)...
												</p>
											)}
										</div>
									)}
								</DuoCard.Root>
							);
						})}
					</div>
				)}
			</DuoCard.Root>
		</div>
	);
}
