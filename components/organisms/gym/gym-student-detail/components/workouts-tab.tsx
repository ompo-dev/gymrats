"use client";

import { Calendar, Clock, Dumbbell, Moon, Trophy } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { Loader2 } from "lucide-react";
import type {
	PlanSlotData,
	StudentData,
	WeeklyPlanData,
	WorkoutHistory,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Início da semana (segunda-feira 00:00) em UTC do timezone local */
function getStartOfWeek(d: Date): Date {
	const date = new Date(d);
	const day = date.getDay();
	// Domingo = 0, Segunda = 1, ... Sábado = 6. Queremos segunda como início.
	const diff = day === 0 ? -6 : 1 - day;
	date.setDate(date.getDate() + diff);
	date.setHours(0, 0, 0, 0);
	return date;
}

function isInCurrentWeek(date: Date | string): boolean {
	const d = typeof date === "string" ? new Date(date) : date;
	const start = getStartOfWeek(new Date());
	const end = new Date(start);
	end.setDate(end.getDate() + 7);
	return d >= start && d < end;
}

function formatDay(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	if (d.toDateString() === today.toDateString()) return "Hoje";
	if (d.toDateString() === yesterday.toDateString()) return "Ontem";
	return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getFeedbackColor(feedback?: string): string {
	switch (feedback) {
		case "excelente":
			return "text-duo-green";
		case "bom":
			return "text-duo-blue";
		case "regular":
			return "text-duo-yellow";
		case "ruim":
			return "text-duo-red";
		default:
			return "text-duo-gray-dark";
	}
}

/** Card de treino no mesmo layout do recent-workouts: linha 1 = nome + dia, linha 2 = tempo + kg (ou tempo + grupo muscular) */
function WorkoutRowCard({
	title,
	dayLabel,
	minutes,
	volumeKg,
	feedback,
}: {
	title: string;
	dayLabel: string;
	minutes: number;
	volumeKg?: number;
	feedback?: string;
}) {
	return (
		<DuoCard.Root variant="default" size="sm" className="p-3">
			<div className="flex items-center justify-between gap-2 mb-1.5">
				<div className="font-bold text-duo-text truncate min-w-0">
					{title || "Treino"}
				</div>
				<div className="text-xs font-bold text-duo-gray-dark shrink-0">
					{dayLabel}
				</div>
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3 text-xs text-duo-gray-dark">
					<div className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						{minutes} min
					</div>
					{volumeKg !== undefined && volumeKg > 0 && (
						<div className="flex items-center gap-1">
							<Trophy className="h-3 w-3" />
							{volumeKg.toFixed(0)} kg
						</div>
					)}
				</div>
				{feedback && (
					<div
						className={cn(
							"text-xs font-bold",
							getFeedbackColor(feedback),
						)}
					>
						{feedback.charAt(0).toUpperCase() + feedback.slice(1)}
					</div>
				)}
			</div>
		</DuoCard.Root>
	);
}

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
	const slots = weeklyPlan?.slots ?? [];
	const sortedSlots = [...slots].sort(
		(a: PlanSlotData, b: PlanSlotData) => a.dayOfWeek - b.dayOfWeek,
	);
	const workoutHistory = student.workoutHistory ?? [];
	const thisWeekHistory = workoutHistory.filter((wh) =>
		isInCurrentWeek(wh.date),
	);

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
						<h2 className="font-bold text-duo-fg">
							Plano Semanal do Aluno
						</h2>
					</div>
				</DuoCard.Header>
				{isLoadingWeeklyPlan ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
					</div>
				) : sortedSlots.length > 0 ? (
					<div className="space-y-4">
						{weeklyPlan && (
							<p className="text-sm text-duo-gray-dark">
								{weeklyPlan.title}
								{weeklyPlan.description &&
									` • ${weeklyPlan.description}`}
							</p>
						)}
						<div className="space-y-2">
							{sortedSlots.map((slot: PlanSlotData) => {
								if (slot.type === "rest" || !slot.workout) {
									return (
										<div
											key={slot.id}
											className="flex items-center gap-3"
										>
											<span className="w-16 text-sm font-bold text-duo-gray-dark shrink-0">
												{DAY_NAMES[slot.dayOfWeek] ?? "—"}
											</span>
											<div className="flex flex-1 items-center gap-2 rounded-lg bg-duo-gray/20 px-4 py-2">
												<Moon className="h-4 w-4 text-duo-gray" />
												<span className="text-sm font-bold text-duo-gray-dark">
													Descanso
												</span>
											</div>
										</div>
									);
								}
								const w = slot.workout;
								const dayLabel = DAY_NAMES[slot.dayOfWeek] ?? "—";
								return (
									<div
										key={slot.id}
										className="flex items-start gap-3"
									>
										<span className="w-16 shrink-0 pt-1.5 text-sm font-bold text-duo-gray-dark">
											{dayLabel}
										</span>
										<div className="flex-1 min-w-0">
											<WorkoutRowCard
												title={w.title}
												dayLabel={dayLabel}
												minutes={w.estimatedTime ?? 0}
											/>
											{w.exercises?.length > 0 && (
												<div className="mt-2 space-y-1 border-t border-duo-border pt-2 pl-3">
													{w.exercises
														.slice(0, 5)
														.map(
															(ex: {
																id: string;
																name: string;
															}) => (
																<p
																	key={ex.id}
																	className="text-xs text-duo-gray-dark"
																>
																	• {ex.name}
																</p>
															),
														)}
													{(w.exercises?.length ??
														0) > 5 && (
														<p className="text-xs text-duo-gray-dark">
															+{" "}
															{(w.exercises?.length ??
																0) - 5}{" "}
															exercício(s)
														</p>
													)}
												</div>
											)}
										</div>
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
							O plano será exibido aqui quando o aluno criar um no
							app.
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
						<h2 className="font-bold text-duo-fg">
							Treinos desta semana
						</h2>
					</div>
				</DuoCard.Header>
				{thisWeekHistory.length === 0 ? (
					<DuoCard.Root
						variant="default"
						size="default"
						className="p-8 text-center"
					>
						<Dumbbell className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
						<p className="font-bold text-duo-gray-dark">
							Nenhum treino nesta semana
						</p>
						<p className="mt-1 text-sm text-duo-gray-dark">
							Os treinos completados aparecerão aqui.
						</p>
					</DuoCard.Root>
				) : (
					<div className="space-y-2">
						{thisWeekHistory.map((wh: WorkoutHistory, idx: number) => (
							<WorkoutRowCard
								key={`wh-${idx}-${wh.date?.toString?.() ?? idx}`}
								title={wh.workoutName}
								dayLabel={formatDay(wh.date)}
								minutes={wh.duration ?? 0}
								volumeKg={wh.totalVolume ?? 0}
								feedback={wh.overallFeedback}
							/>
						))}
					</div>
				)}
			</DuoCard.Root>
		</div>
	);
}
