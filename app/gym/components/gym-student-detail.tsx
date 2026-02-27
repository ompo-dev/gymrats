"use client";

import {
	Activity,
	AlertCircle,
	Apple,
	ArrowLeft,
	Ban,
	Calendar,
	CheckCircle,
	DollarSign,
	Dumbbell,
	Flame,
	Loader2,
	Mail,
	Moon,
	PauseCircle,
	Phone,
	Target,
	TrendingUp,
	Trophy,
	Users,
	XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import { DuoSelect } from "@/components/duo";
import { DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";
import { NutritionTracker } from "@/components/organisms/trackers/nutrition-tracker";
import { useGym } from "@/hooks/use-gym";
import type { DailyNutrition, Payment, PlanSlotData, StudentData, WeeklyPlanData } from "@/lib/types";
import { formatDatePtBr } from "@/lib/utils/date-safe";
import { cn } from "@/lib/utils";

interface GymStudentDetailProps {
	student: StudentData | null;
	payments?: Payment[];
	onBack: () => void;
}

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function GymStudentDetail({
	student,
	payments = [],
	onBack,
}: GymStudentDetailProps) {
	const actions = useGym("actions");
	const [studentPayments, setStudentPayments] = useState(payments);
	const [activeTab, setActiveTab] = useState("overview");
	const [membershipStatus, setMembershipStatus] = useState<"active" | "inactive" | "suspended" | "canceled">(student?.membershipStatus ?? "inactive");

	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanData | null | undefined>(undefined);
	const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition | null>(null);
	const [nutritionDate, setNutritionDate] = useState(() =>
		new Date().toISOString().slice(0, 10),
	);
	const [isLoadingWeeklyPlan, setIsLoadingWeeklyPlan] = useState(false);
	const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);

	const fetchWeeklyPlan = useCallback(async () => {
		if (!student?.id) return;
		setIsLoadingWeeklyPlan(true);
		try {
			const res = await fetch(`/api/gym/students/${student.id}/weekly-plan`);
			const data = await res.json();
			if (data.success && data.weeklyPlan) {
				setWeeklyPlan(data.weeklyPlan);
			} else {
				setWeeklyPlan(null);
			}
		} catch {
			setWeeklyPlan(null);
		} finally {
			setIsLoadingWeeklyPlan(false);
		}
	}, [student?.id]);

	const fetchNutrition = useCallback(async (date?: string) => {
		if (!student?.id) return;
		const d = date ?? nutritionDate;
		setIsLoadingNutrition(true);
		try {
			const res = await fetch(
				`/api/gym/students/${student.id}/nutrition?date=${d}`,
			);
			const data = await res.json();
			if (data.success) {
				setDailyNutrition({
					date: data.date,
					meals: data.meals ?? [],
					totalCalories: data.totalCalories ?? 0,
					totalProtein: data.totalProtein ?? 0,
					totalCarbs: data.totalCarbs ?? 0,
					totalFats: data.totalFats ?? 0,
					waterIntake: data.waterIntake ?? 0,
					targetCalories: data.targetCalories ?? 2000,
					targetProtein: data.targetProtein ?? 150,
					targetCarbs: data.targetCarbs ?? 250,
					targetFats: data.targetFats ?? 65,
					targetWater: data.targetWater ?? 3000,
				});
			} else {
				setDailyNutrition(null);
			}
		} catch {
			setDailyNutrition(null);
		} finally {
			setIsLoadingNutrition(false);
		}
	}, [student?.id, nutritionDate]);

	useEffect(() => {
		if (activeTab === "workouts" && student?.id) {
			fetchWeeklyPlan();
		}
	}, [activeTab, student?.id, fetchWeeklyPlan]);

	useEffect(() => {
		if (activeTab === "diet" && student?.id) {
			fetchNutrition();
		}
	}, [activeTab, student?.id, fetchNutrition]);

	const handleMembershipAction = async (
		action: "suspended" | "canceled" | "active",
	) => {
		const membershipId = student?.gymMembership?.id;
		if (!membershipId) return;
		setIsUpdatingStatus(true);
		try {
			await actions.updateMemberStatus(membershipId, action);
			setMembershipStatus(action);
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	if (!student) {
		return (
			<div className="mx-auto max-w-4xl space-y-6  ">
				<DuoCard.Root variant="default" size="default" className="p-12 text-center">
					<p className="text-xl font-bold text-duo-gray-dark">
						Aluno não encontrado
					</p>
					<DuoButton onClick={onBack} className="mt-4">
						Voltar para Alunos
					</DuoButton>
				</DuoCard.Root>
			</div>
		);
	}

	const togglePaymentStatus = async (paymentId: string) => {
		const payment = studentPayments.find((p) => p.id === paymentId);
		if (!payment) return;

		const newStatus = payment.status === "paid" ? "pending" : "paid";

		// Optimistic update
		setStudentPayments((prev) =>
			prev.map((p) =>
				p.id === paymentId
					? { ...p, status: newStatus, date: newStatus === "paid" ? new Date() : p.date }
					: p
			)
		);

		try {
			await actions.updatePaymentStatus(paymentId, newStatus);
		} catch (error) {
			console.error("Erro ao atualizar pagamento:", error);
			// Revert if error
			setStudentPayments((prev) =>
				prev.map((p) => (p.id === paymentId ? payment : p))
			);
		}
	};

	const tabOptions = [
		{ value: "overview", label: "Visão Geral", emoji: "📊" },
		{ value: "workouts", label: "Treinos", emoji: "💪" },
		{ value: "diet", label: "Dieta", emoji: "🍎" },
		{ value: "progress", label: "Progresso", emoji: "📈" },
		{ value: "records", label: "Recordes", emoji: "🏆" },
		{ value: "payments", label: "Pagamentos", emoji: "💳" },
	];

	return (
		<div className="mx-auto max-w-4xl space-y-6  ">
			<FadeIn>
				<DuoButton variant="ghost" onClick={onBack} className="gap-2 font-bold">
					<ArrowLeft className="h-4 w-4" />
					Voltar para Alunos
				</DuoButton>
			</FadeIn>

			<SlideIn delay={0.1}>
				<DuoCard.Root variant="default" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">{student.name}</h2>
						</div>
					</DuoCard.Header>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
						<div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full sm:mx-0 sm:h-32 sm:w-32">
							<Image
								src={student.avatar || "/placeholder.svg"}
								alt={student.name}
								fill
								className="object-cover"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
								<span
									className={cn(
										"rounded-full px-3 py-1 text-sm font-bold",
										student.membershipStatus === "active"
											? "bg-duo-green text-white"
											: "bg-gray-300 text-duo-gray-dark",
									)}
								>
									{student.membershipStatus === "active" ? "Ativo" : "Inativo"}
								</span>
							</div>
							<div className="mb-4 space-y-2 text-sm text-duo-gray-dark">
								<div className="flex items-center gap-2 wrap-break-words">
									<Mail className="h-4 w-4 shrink-0" />
									<span className="break-all">{student.email}</span>
								</div>
								<div className="flex items-center gap-2">
									<Phone className="h-4 w-4 shrink-0" />
									<span>{student.phone}</span>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 shrink-0" />
									<span>
										Membro desde {formatDatePtBr(student.joinDate) || "N/A"}
									</span>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<DuoButton
									size="sm"
									variant="outline"
									className="flex-1 sm:flex-initial"
								>
									<Dumbbell className="h-4 w-4" />
									Atribuir Treino
								</DuoButton>
								<DuoButton
									size="sm"
									variant="outline"
									className="flex-1 sm:flex-initial"
								>
									<Apple className="h-4 w-4" />
									Atribuir Dieta
								</DuoButton>
								{/* Botões de gestão de matrícula */}
								{student.gymMembership?.id && (
									<>
										{membershipStatus === "active" ? (
											<DuoButton
												size="sm"
												variant="outline"
												className="flex-1 sm:flex-initial border-amber-300 text-amber-700 hover:bg-amber-50"
												onClick={() => handleMembershipAction("suspended")}
												disabled={isUpdatingStatus}
											>
												{isUpdatingStatus ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<PauseCircle className="h-4 w-4" />
												)}
												Suspender
											</DuoButton>
										) : membershipStatus === "suspended" ? (
											<DuoButton
												size="sm"
												variant="outline"
												className="flex-1 sm:flex-initial border-duo-green text-duo-green hover:bg-duo-green/10"
												onClick={() => handleMembershipAction("active")}
												disabled={isUpdatingStatus}
											>
												{isUpdatingStatus ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<CheckCircle className="h-4 w-4" />
												)}
												Reativar
											</DuoButton>
										) : null}
										{membershipStatus !== "canceled" && (
											<DuoButton
												size="sm"
												variant="outline"
												className="flex-1 sm:flex-initial border-duo-red text-duo-red hover:bg-duo-red/10"
												onClick={() => handleMembershipAction("canceled")}
												disabled={isUpdatingStatus}
											>
												{isUpdatingStatus ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Ban className="h-4 w-4" />
												)}
												Cancelar Matrícula
											</DuoButton>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoStatsGrid columns={4} className="gap-4">
					<DuoStatCard
						icon={Flame}
						value={String(student.currentStreak)}
						label="Sequência"
						iconColor="var(--duo-accent)"
					/>
					<DuoStatCard
						icon={Trophy}
						value={String(student.progress?.currentLevel ?? 1)}
						label="Nível"
						iconColor="var(--duo-secondary)"
					/>
					<DuoStatCard
						icon={Activity}
						value={String(student.totalVisits)}
						label="Treinos"
						iconColor="var(--duo-primary)"
					/>
					<DuoStatCard
						icon={Target}
						value={`${student.attendanceRate}%`}
						label="Frequência"
						iconColor="#A560E8"
					/>
				</DuoStatsGrid>
			</SlideIn>

			<SlideIn delay={0.3}>
				<DuoCard.Root variant="default" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<Dumbbell className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">Selecione a Categoria</h2>
						</div>
					</DuoCard.Header>
					<DuoSelect
						options={tabOptions}
						value={activeTab}
						onChange={(value) => setActiveTab(value)}
						placeholder="Selecione a categoria"
					/>
				</DuoCard.Root>
			</SlideIn>

			{activeTab === "overview" && (
				<SlideIn delay={0.4}>
					<div className="grid gap-6 lg:grid-cols-2">
						{student.gymMembership && (
							<DuoCard.Root variant="default" padding="md">
								<DuoCard.Header>
									<div className="flex items-center gap-2">
										<DollarSign className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
										<h2 className="font-bold text-[var(--duo-fg)]">Plano e Matrícula</h2>
									</div>
								</DuoCard.Header>
								<div className="space-y-3">
									<DuoCard.Root variant="default" size="sm">
										<div className="flex justify-between items-center">
											<span className="font-bold text-duo-gray-dark">Plano</span>
											<span className="text-duo-text font-bold">
												{student.gymMembership.planName}
											</span>
										</div>
									</DuoCard.Root>
									<DuoCard.Root variant="default" size="sm">
										<div className="flex justify-between items-center">
											<span className="font-bold text-duo-gray-dark">Valor</span>
											<span className="text-duo-green font-bold">
												R$ {student.gymMembership.amount?.toFixed(2) ?? "0,00"}/mês
											</span>
										</div>
									</DuoCard.Root>
									<DuoCard.Root variant="default" size="sm">
										<div className="flex justify-between items-center">
											<span className="font-bold text-duo-gray-dark">Próxima cobrança</span>
											<span className="text-duo-text font-bold">
												{student.gymMembership.nextBillingDate
													? formatDatePtBr(student.gymMembership.nextBillingDate) ?? "N/A"
													: "N/A"}
											</span>
										</div>
									</DuoCard.Root>
									<DuoCard.Root variant="default" size="sm">
										<div className="flex justify-between items-center">
											<span className="font-bold text-duo-gray-dark">Status</span>
											<span
												className={cn(
													"font-bold",
													student.gymMembership.status === "active" && "text-duo-green",
													student.gymMembership.status === "suspended" && "text-duo-orange",
													student.gymMembership.status === "canceled" && "text-duo-red",
												)}
											>
												{student.gymMembership.status === "active" && "Ativo"}
												{student.gymMembership.status === "suspended" && "Suspenso"}
												{student.gymMembership.status === "canceled" && "Cancelado"}
												{student.gymMembership.status === "pending" && "Pendente"}
											</span>
										</div>
									</DuoCard.Root>
								</div>
							</DuoCard.Root>
						)}
						<DuoCard.Root variant="default" padding="md">
							<DuoCard.Header>
								<div className="flex items-center gap-2">
									<Users className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
									<h2 className="font-bold text-[var(--duo-fg)]">Informações do Perfil</h2>
								</div>
							</DuoCard.Header>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{[
									{ label: "Idade", value: `${student.age ?? 0} anos` },
									{
										label: "Gênero",
										value: student.gender === "male" ? "Masculino" : student.gender === "female" ? "Feminino" : student.gender || "—",
									},
									{ label: "Altura", value: `${student.profile?.height ?? 0} cm` },
									{
										label: "Peso Atual",
										value: `${student.currentWeight ?? 0} kg`,
									},
									{
										label: "Nível",
										value: String(student.profile?.fitnessLevel ?? "iniciante").replace("beginner", "iniciante"),
									},
									{
										label: "Frequência Semanal",
										value: `${student.profile?.weeklyWorkoutFrequency ?? 0}x semana`,
									},
								].map((info) => (
									<DuoCard.Root key={info.label} variant="default" size="sm">
										<div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
											<span className="font-bold text-duo-gray-dark text-sm sm:text-base">
												{info.label}
											</span>
											<span className="text-duo-text text-sm sm:text-base wrap-break-words">
												{info.value}
											</span>
										</div>
									</DuoCard.Root>
								))}
							</div>
						</DuoCard.Root>

						<DuoCard.Root variant="default" padding="md">
							<DuoCard.Header>
								<div className="flex items-center gap-2">
									<Target className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
									<h2 className="font-bold text-[var(--duo-fg)]">Objetivos</h2>
								</div>
							</DuoCard.Header>
							<div className="flex flex-wrap gap-2">
								{(student.profile?.goals ?? []).map((goal) => (
									<span
										key={goal}
										className="rounded-full bg-duo-blue/15 px-3 py-1 text-sm font-bold text-duo-blue capitalize"
									>
										{goal.replace("-", " ")}
									</span>
								))}
								{(student.profile?.goals ?? []).length === 0 && (
									<span className="text-sm text-duo-gray-dark">Nenhum objetivo definido</span>
								)}
							</div>

							<h3 className="mb-3 mt-6 font-bold text-duo-text">
								Equipamentos Favoritos
							</h3>
							<div className="flex flex-wrap gap-2">
								{(student.favoriteEquipment ?? []).map((equipment) => (
									<span
										key={equipment}
										className="inline-flex items-center gap-1.5 rounded-full bg-duo-orange/15 px-3 py-1 text-sm font-bold text-duo-orange"
									>
										<Dumbbell className="h-3.5 w-3.5" />
										{equipment}
									</span>
								))}
								{(student.favoriteEquipment ?? []).length === 0 && (
									<span className="text-sm text-duo-gray-dark">Nenhum equipamento preferido</span>
								)}
							</div>
						</DuoCard.Root>

						<div className="lg:col-span-2">
							<WeightProgressCard
								currentWeight={student.currentWeight ?? null}
								weightGain={(student as { weightGain?: number | null }).weightGain ?? null}
								hasWeightLossGoal={(student as { hasWeightLossGoal?: boolean }).hasWeightLossGoal ?? false}
								weightHistory={student.weightHistory ?? []}
							/>
						</div>
					</div>
				</SlideIn>
			)}

			{activeTab === "workouts" && (
				<SlideIn delay={0.4}>
					<div className="space-y-6">
						{/* Plano Semanal */}
						<DuoCard.Root variant="default" padding="md">
							<DuoCard.Header>
								<div className="flex items-center gap-2">
									<Calendar className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
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
										{weeklyPlan.slots.map((slot: PlanSlotData, index: number) => {
											if (slot.type === "rest" || !slot.workout) {
												return (
													<div key={slot.id} className="flex items-center gap-3">
														<span className="w-16 text-sm font-bold text-duo-gray-dark">
															{DAY_NAMES[slot.dayOfWeek] ?? "—"}
														</span>
														<div className="flex items-center gap-2 rounded-lg bg-duo-gray/20 px-4 py-2">
															<Moon className="h-4 w-4 text-duo-gray" />
															<span className="text-sm font-bold text-duo-gray-dark">Descanso</span>
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
									<p className="font-bold text-duo-gray-dark">Aluno ainda não possui plano semanal</p>
									<p className="mt-1 text-sm text-duo-gray-dark">
										O plano será exibido aqui quando o aluno criar um no app.
									</p>
								</div>
							)}
						</DuoCard.Root>

						{/* Histórico de Treinos */}
						<DuoCard.Root variant="default" padding="md">
							<DuoCard.Header>
								<div className="flex items-center gap-2">
									<Trophy className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
									<h2 className="font-bold text-[var(--duo-fg)]">Histórico de Treinos</h2>
								</div>
							</DuoCard.Header>
							{(student.workoutHistory ?? []).length === 0 ? (
								<DuoCard.Root variant="default" size="default" className="p-8 text-center">
									<Dumbbell className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
									<p className="font-bold text-duo-gray-dark">Nenhum treino registrado ainda</p>
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
															{wh.date ? new Date(wh.date).toLocaleDateString("pt-BR") : "N/A"}
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
				</SlideIn>
			)}

			{activeTab === "diet" && (
				<SlideIn delay={0.4}>
					<DuoCard.Root variant="default" padding="md">
						<DuoCard.Header>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Apple className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
									<h2 className="font-bold text-[var(--duo-fg)]">Nutrição e Dieta do Aluno</h2>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="date"
										value={nutritionDate}
										onChange={(e) => {
											setNutritionDate(e.target.value);
											fetchNutrition(e.target.value);
										}}
										className="rounded-lg border border-duo-border bg-duo-bg px-3 py-1.5 text-sm font-bold text-duo-text"
									/>
								</div>
							</div>
						</DuoCard.Header>
						{isLoadingNutrition ? (
							<div className="flex items-center justify-center py-12">
								<Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
							</div>
						) : dailyNutrition ? (
							<NutritionTracker
								nutrition={dailyNutrition}
								onMealComplete={() => {}}
								onAddMeal={() => {}}
								readOnly
							/>
						) : (
							<div className="py-12 text-center">
								<Apple className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
								<p className="font-bold text-duo-gray-dark">
									Nenhum registro de nutrição para esta data
								</p>
								<p className="mt-1 text-sm text-duo-gray-dark">
									As metas do perfil: {student.profile?.targetCalories ?? 2000} kcal,{" "}
									{student.profile?.targetProtein ?? 150}g Proteína,{" "}
									{student.profile?.targetCarbs ?? 250}g Carboidratos,{" "}
									{student.profile?.targetFats ?? 65}g Gorduras.
								</p>
							</div>
						)}
					</DuoCard.Root>
				</SlideIn>
			)}

			{activeTab === "progress" && (
				<SlideIn delay={0.4}>
					<DuoCard.Root variant="default" padding="md">
						<DuoCard.Header>
							<div className="flex items-center gap-2">
								<Activity className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
								<h2 className="font-bold text-[var(--duo-fg)]">Progresso e XP</h2>
							</div>
						</DuoCard.Header>
						<div className="mb-6">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-bold text-duo-text">
									Nível {student.progress?.currentLevel ?? 1}
								</span>
								<span className="text-sm text-duo-gray-dark">
									{student.progress?.totalXP ?? 0} /{" "}
									{(student.progress?.totalXP ?? 0) + (student.progress?.xpToNextLevel ?? 100)} XP
								</span>
							</div>
							<div className="h-4 overflow-hidden rounded-full bg-gray-200">
								<div
									className="h-full bg-duo-green"
									style={{
										width: `${
											((student.progress?.totalXP ?? 0) /
												((student.progress?.totalXP ?? 0) +
													(student.progress?.xpToNextLevel ?? 100) || 1)) *
											100
										}%`,
									}}
								/>
							</div>
						</div>

						<h3 className="mb-3 font-bold text-duo-text text-sm sm:text-base">
							Atividade Semanal
						</h3>
						<div className="grid grid-cols-7 gap-1 sm:gap-2">
							{(["D", "S", "T", "Q", "Q", "S", "S"] as const).map(
								(day, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: index needed for weeklyXP access
									<div key={`weekday-${day}-${index}`} className="text-center">
										<p className="mb-1 sm:mb-2 text-xs font-bold text-duo-gray-dark">
											{day}
										</p>
										<DuoCard.Root variant="default" size="sm" className="p-2 sm:p-3">
											<p className="text-sm sm:text-lg font-bold text-duo-green">
												{student.progress?.weeklyXP?.[index] ?? 0}
											</p>
										</DuoCard.Root>
									</div>
								),
							)}
						</div>
					</DuoCard.Root>
				</SlideIn>
			)}

			{activeTab === "records" && (
				<SlideIn delay={0.4}>
					<DuoCard.Root variant="default" padding="md">
						<DuoCard.Header>
							<div className="flex items-center gap-2">
								<Trophy className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
								<h2 className="font-bold text-[var(--duo-fg)]">Recordes Pessoais</h2>
							</div>
						</DuoCard.Header>
						<div className="space-y-3">
							{(student.personalRecords ?? []).map((record, idx) => (
								<DuoCard.Root
									key={`${record.exerciseName ?? "ex"}-${record.date?.toISOString?.() ?? idx}-${record.value}`}
									variant="orange"
									size="default"
								>
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
										<div className="flex-1 min-w-0">
											<p className="text-base sm:text-lg font-bold text-duo-text wrap-break-words">
												{record.exerciseName}
											</p>
											<p className="text-xs sm:text-sm text-duo-gray-dark">
												{formatDatePtBr(record.date) || "N/A"}
											</p>
										</div>
										<div className="text-left sm:text-right">
											<p className="text-2xl sm:text-3xl font-bold text-duo-orange">
												{record.value}kg
											</p>
											<p className="text-xs font-bold text-duo-gray-dark capitalize">
												{record.type.replace("-", " ")}
											</p>
										</div>
									</div>
								</DuoCard.Root>
							))}
						</div>
					</DuoCard.Root>
				</SlideIn>
			)}

			{activeTab === "payments" && (
				<SlideIn delay={0.4}>
					<DuoCard.Root variant="default" padding="md">
						<DuoCard.Header>
							<div className="flex items-center gap-2">
								<DollarSign className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
								<h2 className="font-bold text-[var(--duo-fg)]">Histórico de Pagamentos</h2>
							</div>
						</DuoCard.Header>
						<div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
							<DuoCard.Root variant="highlighted" size="sm">
								<div className="flex items-center gap-3">
									<CheckCircle className="h-6 w-6 text-duo-green" />
									<div>
										<p className="text-sm font-bold text-duo-gray-dark">
											Pagos
										</p>
										<p className="text-2xl font-bold text-duo-green">
											{
												studentPayments.filter((p) => p.status === "paid")
													.length
											}
										</p>
									</div>
								</div>
							</DuoCard.Root>

							<DuoCard.Root variant="orange" size="sm">
								<div className="flex items-center gap-3">
									<AlertCircle className="h-6 w-6 text-duo-orange" />
									<div>
										<p className="text-sm font-bold text-duo-gray-dark">
											Pendentes
										</p>
										<p className="text-2xl font-bold text-duo-orange">
											{
												studentPayments.filter((p) =>
													p.status === "pending" || p.status === "overdue",
												).length
											}
										</p>
									</div>
								</div>
							</DuoCard.Root>

							<DuoCard.Root variant="blue" size="sm">
								<div className="flex items-center gap-3">
									<DollarSign className="h-6 w-6 text-duo-blue" />
									<div>
										<p className="text-sm font-bold text-duo-gray-dark">
											Total Pago
										</p>
										<p className="text-xl font-bold text-duo-blue">
											R${" "}
											{studentPayments
												.filter((p) => p.status === "paid")
												.reduce((sum, p) => sum + p.amount, 0)
												.toFixed(2)}
										</p>
									</div>
								</div>
							</DuoCard.Root>

							<DuoCard.Root variant="default" size="sm">
								<div className="flex items-center gap-3">
									<AlertCircle className="h-6 w-6 text-duo-orange" />
									<div>
										<p className="text-sm font-bold text-duo-gray-dark">
											Total Pendente
										</p>
										<p className="text-xl font-bold text-duo-orange">
											R${" "}
											{studentPayments
												.filter((p) =>
													p.status === "pending" || p.status === "overdue",
												)
												.reduce((sum, p) => sum + p.amount, 0)
												.toFixed(2)}
										</p>
									</div>
								</div>
							</DuoCard.Root>
						</div>

						<div className="space-y-3">
							{studentPayments.map((payment, index) => (
								<motion.div
									key={payment.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.4 }}
								>
									<DuoCard.Root variant="default" size="default">
										<div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<h3 className="font-bold text-duo-text text-sm sm:text-base wrap-break-words">
													{payment.planName}
												</h3>
												<p className="text-xs sm:text-sm text-duo-gray-dark mt-1">
													Vencimento:{" "}
													{formatDatePtBr(payment.dueDate) || "N/A"}
												</p>
												{payment.status === "paid" && (
													<p className="text-xs sm:text-sm text-duo-gray-dark">
														Pago em: {formatDatePtBr(payment.date) || "N/A"}
													</p>
												)}
												<p className="text-xs sm:text-sm text-duo-gray-dark capitalize">
													Método: {payment.paymentMethod.replace("-", " ")}
												</p>
											</div>

											<div className="w-full sm:w-auto text-left sm:text-right">
												<p className="text-xl sm:text-2xl font-bold text-duo-blue mb-2">
													R$ {payment.amount.toFixed(2)}
												</p>

												<DuoButton
													onClick={() => togglePaymentStatus(payment.id)}
													variant={
														payment.status === "paid" ? "primary" : "outline"
													}
													size="sm"
													className="w-full sm:w-auto"
												>
													{payment.status === "paid" ? (
														<>
															<CheckCircle className="h-4 w-4" />
															Pago
														</>
													) : (
														<>
															<XCircle className="h-4 w-4" />
															<span className="hidden sm:inline">
																Marcar como Pago
															</span>
															<span className="sm:hidden">Marcar Pago</span>
														</>
													)}
												</DuoButton>
											</div>
										</div>
									</DuoCard.Root>
								</motion.div>
							))}
						</div>
					</DuoCard.Root>
				</SlideIn>
			)}
		</div>
	);
}
