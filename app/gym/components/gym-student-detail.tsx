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
	Edit,
	Flame,
	Loader2,
	Mail,
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
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/ui/duo-card";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import type { Payment, StudentData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GymStudentDetailProps {
	student: StudentData | null;
	payments?: Payment[];
	onBack: () => void;
}

export function GymStudentDetail({
	student,
	payments = [],
	onBack,
}: GymStudentDetailProps) {
	const [studentPayments, setStudentPayments] = useState(payments);
	const [activeTab, setActiveTab] = useState("overview");
	const [membershipStatus, setMembershipStatus] = useState<"active" | "inactive" | "suspended" | "canceled">(student?.membershipStatus ?? "inactive");

	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	const handleMembershipAction = async (
		action: "suspended" | "canceled" | "active",
	) => {
		const membershipId = student?.gymMembership?.id;
		if (!membershipId) return;
		setIsUpdatingStatus(true);
		try {
			const res = await fetch(`/api/gyms/members/${membershipId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: action }),
			});
			if (res.ok) {
				setMembershipStatus(action);
			}
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	if (!student) {
		return (
			<div className="mx-auto max-w-4xl space-y-6  ">
				<DuoCard variant="default" size="default" className="p-12 text-center">
					<p className="text-xl font-bold text-duo-gray-dark">
						Aluno não encontrado
					</p>
					<Button onClick={onBack} className="mt-4">
						Voltar para Alunos
					</Button>
				</DuoCard>
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
			const res = await fetch(`/api/gyms/payments/${paymentId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (!res.ok) {
				// Revert if failed
				setStudentPayments((prev) =>
					prev.map((p) => (p.id === paymentId ? payment : p))
				);
				console.error("Falha ao atualizar pagamento");
			}
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
				<Button variant="ghost" onClick={onBack} className="gap-2 font-bold">
					<ArrowLeft className="h-4 w-4" />
					Voltar para Alunos
				</Button>
			</FadeIn>

			<SlideIn delay={0.1}>
				<SectionCard title={student.name} icon={Users} variant="default">
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
										Membro desde {student.joinDate.toLocaleDateString("pt-BR")}
									</span>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button size="sm" className="flex-1 sm:flex-initial">
									<Edit className="h-4 w-4" />
									Editar Perfil
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="flex-1 sm:flex-initial"
								>
									<Dumbbell className="h-4 w-4" />
									Atribuir Treino
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="flex-1 sm:flex-initial"
								>
									<Apple className="h-4 w-4" />
									Atribuir Dieta
								</Button>
								{/* Botões de gestão de matrícula */}
								{student.gymMembership?.id && (
									<>
										{membershipStatus === "active" ? (
											<Button
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
											</Button>
										) : membershipStatus === "suspended" ? (
											<Button
												size="sm"
												variant="outline"
												className="flex-1 sm:flex-initial border-green-300 text-green-700 hover:bg-green-50"
												onClick={() => handleMembershipAction("active")}
												disabled={isUpdatingStatus}
											>
												{isUpdatingStatus ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<CheckCircle className="h-4 w-4" />
												)}
												Reativar
											</Button>
										) : null}
										{membershipStatus !== "canceled" && (
											<Button
												size="sm"
												variant="outline"
												className="flex-1 sm:flex-initial border-red-300 text-red-700 hover:bg-red-50"
												onClick={() => handleMembershipAction("canceled")}
												disabled={isUpdatingStatus}
											>
												{isUpdatingStatus ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Ban className="h-4 w-4" />
												)}
												Cancelar Matrícula
											</Button>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.2}>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatCardLarge
						icon={Flame}
						value={String(student.currentStreak)}
						label="Sequência"
						iconColor="duo-orange"
					/>
					<StatCardLarge
						icon={Trophy}
						value={String(student.progress.currentLevel)}
						label="Nível"
						iconColor="duo-blue"
					/>
					<StatCardLarge
						icon={Activity}
						value={String(student.totalVisits)}
						label="Treinos"
						iconColor="duo-green"
					/>
					<StatCardLarge
						icon={Target}
						value={`${student.attendanceRate}%`}
						label="Frequência"
						iconColor="duo-purple"
					/>
				</div>
			</SlideIn>

			<SlideIn delay={0.3}>
				<SectionCard title="Selecione a Categoria" icon={Dumbbell}>
					<OptionSelector
						options={tabOptions}
						value={activeTab}
						onChange={(value) => setActiveTab(value)}
						layout="grid"
						columns={2}
						size="md"
						textAlign="center"
						animate={true}
					/>
				</SectionCard>
			</SlideIn>

			{activeTab === "overview" && (
				<SlideIn delay={0.4}>
					<div className="grid gap-6 lg:grid-cols-2">
						<SectionCard title="Informações do Perfil" icon={Users}>
							<div className="space-y-3">
								{[
									{ label: "Idade", value: `${student.age} anos` },
									{
										label: "Gênero",
										value: student.gender === "male" ? "Masculino" : "Feminino",
									},
									{ label: "Altura", value: `${student.profile.height}cm` },
									{
										label: "Peso Atual",
										value: `${student.currentWeight}kg`,
									},
									{
										label: "Nível",
										value: student.profile.fitnessLevel,
									},
									{
										label: "Frequência Semanal",
										value: `${student.profile.weeklyWorkoutFrequency}x semana`,
									},
								].map((info) => (
									<DuoCard key={info.label} variant="default" size="sm">
										<div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
											<span className="font-bold text-duo-gray-dark text-sm sm:text-base">
												{info.label}
											</span>
											<span className="text-duo-text text-sm sm:text-base wrap-break-words">
												{info.value}
											</span>
										</div>
									</DuoCard>
								))}
							</div>
						</SectionCard>

						<SectionCard title="Objetivos" icon={Target}>
							<div className="space-y-2">
								{student.profile.goals.map((goal) => (
									<DuoCard
										key={goal}
										variant="highlighted"
										size="sm"
										className="p-3"
									>
										<p className="font-bold capitalize text-duo-text">
											{goal.replace("-", " ")}
										</p>
									</DuoCard>
								))}
							</div>

							<h3 className="mb-3 mt-6 font-bold text-duo-text">
								Equipamentos Favoritos
							</h3>
							<div className="space-y-2">
								{student.favoriteEquipment.map((equipment) => (
									<DuoCard key={equipment} variant="default" size="sm">
										<div className="flex items-center gap-2">
											<Dumbbell className="h-4 w-4 text-duo-orange" />
											<span className="text-sm text-duo-text">{equipment}</span>
										</div>
									</DuoCard>
								))}
							</div>
						</SectionCard>

						<SectionCard
							title="Evolução de Peso"
							icon={TrendingUp}
							className="lg:col-span-2"
						>
							<div className="space-y-2">
								{student.weightHistory.map((record, whIdx) => (
									<DuoCard
										key={`${record.date.toISOString()}-${record.weight}`}
										variant="default"
										size="sm"
									>
										<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<Calendar className="h-5 w-5 text-duo-gray-dark shrink-0" />
												<span className="font-bold text-duo-text text-sm sm:text-base truncate">
													{record.date.toLocaleDateString("pt-BR")}
												</span>
											</div>
											<div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
												<span className="text-xl sm:text-2xl font-bold text-duo-blue">
													{record.weight}kg
												</span>
												{whIdx < student.weightHistory.length - 1 && (
													<div className="flex items-center gap-1">
														{record.weight <
														student.weightHistory[
															whIdx + 1
														].weight ? (
															<>
																<TrendingUp className="h-4 w-4 text-duo-red shrink-0" />
																<span className="text-xs sm:text-sm font-bold text-duo-red whitespace-nowrap">
																	+
																	{(
																		student.weightHistory[whIdx + 1].weight -
																		record.weight
																	).toFixed(1)}
																	kg
																</span>
															</>
														) : (
															<>
																<TrendingUp className="h-4 w-4 rotate-180 text-duo-green shrink-0" />
																<span className="text-xs sm:text-sm font-bold text-duo-green whitespace-nowrap">
																	{(
																		record.weight -
																		student.weightHistory[whIdx + 1].weight
																	).toFixed(1)}
																	kg
																</span>
															</>
														)}
													</div>
												)}
											</div>
										</div>
									</DuoCard>
								))}
							</div>
						</SectionCard>
					</div>
				</SlideIn>
			)}

			{activeTab === "workouts" && (
				<SlideIn delay={0.4}>
					<SectionCard title="Histórico de Treinos" icon={Dumbbell}>
						{student.workoutHistory.length === 0 ? (
							<DuoCard variant="default" size="default" className="p-8 text-center">
								<Dumbbell className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
								<p className="font-bold text-duo-gray-dark">Nenhum treino registrado ainda</p>
								<p className="mt-1 text-sm text-duo-gray-dark">
									Os treinos do aluno aparecerão aqui assim que forem completados.
								</p>
							</DuoCard>
						) : (
							<div className="space-y-3">
								{student.workoutHistory.map((wh, idx) => (
									<DuoCard
										key={`wh-${idx}-${wh.date.toISOString()}`}
										variant="default"
										size="default"
									>
										<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex-1 min-w-0">
												<p className="font-bold text-duo-text text-sm sm:text-base">
													{wh.workoutName || "Treino"}
												</p>
												<p className="text-xs text-duo-gray-dark mt-0.5">
													{new Date(wh.date).toLocaleDateString("pt-BR")}
												</p>
											</div>
											<div className="flex gap-4 text-sm">
												<span className="flex items-center gap-1 text-duo-blue font-bold">
													<Activity className="h-3.5 w-3.5" />
													{wh.duration} min
												</span>
												{wh.totalVolume > 0 && (
													<span className="flex items-center gap-1 text-duo-green font-bold">
														<TrendingUp className="h-3.5 w-3.5" />
														{wh.totalVolume.toFixed(0)} kg
													</span>
												)}
											</div>
										</div>
										{wh.exercises.length > 0 && (
											<div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
												{wh.exercises.slice(0, 3).map((ex) => (
													<p
														key={ex.id}
														className="text-xs text-duo-gray-dark"
													>
														• {ex.exerciseName}
													</p>
												))}
												{wh.exercises.length > 3 && (
													<p className="text-xs text-duo-gray-dark">
														e mais {wh.exercises.length - 3} exercício(s)...
													</p>
												)}
											</div>
										)}
									</DuoCard>
								))}
							</div>
						)}
					</SectionCard>
				</SlideIn>
			)}

			{activeTab === "diet" && (
				<SlideIn delay={0.4}>
					<SectionCard title="Nutrição e Dieta" icon={Apple}>
						<div className="space-y-6">
							{/* Targets vs Consumed */}
							<div className="space-y-4">
								<h3 className="font-bold text-duo-text">Resumo do Dia</h3>

								{student.todayNutrition ? (
									<>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<DuoCard variant="default" size="default">
												<div className="flex items-center justify-between mb-2">
													<p className="font-bold text-duo-text">Calorias</p>
													<p className="text-sm font-bold text-duo-gray-dark">
														{student.todayNutrition.totalCalories} /{" "}
														{student.profile.targetCalories} kcal
													</p>
												</div>
												<div className="h-4 overflow-hidden rounded-full bg-gray-200">
													<div
														className="h-full bg-duo-orange"
														style={{
															width: `${Math.min(
																(student.todayNutrition.totalCalories /
																	(student.profile.targetCalories || 2000)) *
																	100,
																100,
															)}%`,
														}}
													/>
												</div>
											</DuoCard>

											<DuoCard variant="blue" size="default">
												<div className="flex items-center justify-between mb-2">
													<p className="font-bold text-duo-gray-dark">Água</p>
													<p className="text-sm font-bold text-duo-blue">
														{student.todayNutrition.waterIntake} / 3000 ml
													</p>
												</div>
												<div className="h-4 overflow-hidden rounded-full bg-blue-200">
													<div
														className="h-full bg-duo-blue"
														style={{
															width: `${Math.min(
																(student.todayNutrition.waterIntake / 3000) *
																	100,
																100,
															)}%`,
														}}
													/>
												</div>
											</DuoCard>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
											<DuoCard variant="highlighted" size="sm" className="p-3">
												<p className="text-xs font-bold text-duo-gray-dark mb-1">
													Proteína
												</p>
												<p className="text-lg font-bold text-duo-green">
													{student.todayNutrition.totalProtein.toFixed(0)} /{" "}
													{student.profile.targetProtein}g
												</p>
												<div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
													<div
														className="h-full bg-duo-green"
														style={{
															width: `${Math.min(
																(student.todayNutrition.totalProtein /
																	(student.profile.targetProtein || 150)) *
																	100,
																100,
															)}%`,
														}}
													/>
												</div>
											</DuoCard>
											<DuoCard variant="blue" size="sm" className="p-3">
												<p className="text-xs font-bold text-duo-gray-dark mb-1">
													Carboidratos
												</p>
												<p className="text-lg font-bold text-duo-blue">
													{student.todayNutrition.totalCarbs.toFixed(0)} /{" "}
													{student.profile.targetCarbs}g
												</p>
												<div className="mt-1 h-2 overflow-hidden rounded-full bg-blue-100">
													<div
														className="h-full bg-duo-blue"
														style={{
															width: `${Math.min(
																(student.todayNutrition.totalCarbs /
																	(student.profile.targetCarbs || 250)) *
																	100,
																100,
															)}%`,
														}}
													/>
												</div>
											</DuoCard>
											<DuoCard
												variant="default"
												size="sm"
												className="border-duo-purple bg-duo-purple/10 p-3"
											>
												<p className="text-xs font-bold text-duo-gray-dark mb-1">
													Gorduras
												</p>
												<p className="text-lg font-bold text-duo-purple">
													{student.todayNutrition.totalFats.toFixed(0)} /{" "}
													{student.profile.targetFats}g
												</p>
												<div className="mt-1 h-2 overflow-hidden rounded-full bg-purple-100">
													<div
														className="h-full bg-duo-purple"
														style={{
															width: `${Math.min(
																(student.todayNutrition.totalFats /
																	(student.profile.targetFats || 70)) *
																	100,
																100,
															)}%`,
														}}
													/>
												</div>
											</DuoCard>
										</div>

										<h3 className="font-bold text-duo-text mt-4">Refeições</h3>
										<div className="space-y-3">
											{student.todayNutrition.meals.map((meal) => (
												<DuoCard
													key={meal.id}
													variant="default"
													size="default"
												>
													<div className="flex items-center justify-between mb-2">
														<div>
															<p className="font-bold text-duo-text capitalize">
																{meal.name}
															</p>
															<p className="text-xs text-duo-gray-dark">
																{meal.time || "Sem horário"}
															</p>
														</div>
														<p className="font-bold text-duo-orange">
															{meal.calories} kcal
														</p>
													</div>
													{meal.foods && meal.foods.length > 0 && (
														<div className="space-y-1 pl-2 border-l-2 border-gray-100">
															{meal.foods.map((food, idx) => (
																<div
																	// biome-ignore lint/suspicious/noArrayIndexKey: simple list
																	key={idx}
																	className="flex justify-between text-xs text-duo-gray-dark"
																>
																	<span>
																		{food.servings}x {food.foodName}
																	</span>
																	<span>{food.calories} kcal</span>
																</div>
															))}
														</div>
													)}
												</DuoCard>
											))}
										</div>
									</>
								) : (
									<div className="text-center py-8">
										<Apple className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
										<p className="font-bold text-duo-gray-dark">
											Nenhum registro de nutrição hoje
										</p>
										<p className="mt-1 text-sm text-duo-gray-dark">
											As metas do plano são: {student.profile.targetCalories}{" "}
											kcal, {student.profile.targetProtein}g Proteína,{" "}
											{student.profile.targetCarbs}g Carboidratos,{" "}
											{student.profile.targetFats}g Gorduras.
										</p>
									</div>
								)}
							</div>
						</div>
					</SectionCard>
				</SlideIn>
			)}

			{activeTab === "progress" && (
				<SlideIn delay={0.4}>
					<SectionCard title="Progresso e XP" icon={Activity}>
						<div className="mb-6">
							<div className="mb-2 flex items-center justify-between">
								<span className="font-bold text-duo-text">
									Nível {student.progress.currentLevel}
								</span>
								<span className="text-sm text-duo-gray-dark">
									{student.progress.totalXP} /{" "}
									{student.progress.totalXP + student.progress.xpToNextLevel} XP
								</span>
							</div>
							<div className="h-4 overflow-hidden rounded-full bg-gray-200">
								<div
									className="h-full bg-duo-green"
									style={{
										width: `${
											(student.progress.totalXP /
												(student.progress.totalXP +
													student.progress.xpToNextLevel)) *
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
										<DuoCard variant="default" size="sm" className="p-2 sm:p-3">
											<p className="text-sm sm:text-lg font-bold text-duo-green">
												{student.progress.weeklyXP[index]}
											</p>
										</DuoCard>
									</div>
								),
							)}
						</div>
					</SectionCard>
				</SlideIn>
			)}

			{activeTab === "records" && (
				<SlideIn delay={0.4}>
					<SectionCard title="Recordes Pessoais" icon={Trophy}>
						<div className="space-y-3">
							{student.personalRecords.map((record) => (
								<DuoCard
									key={`${record.exerciseName}-${record.date.toISOString()}-${record.value}`}
									variant="orange"
									size="default"
								>
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
										<div className="flex-1 min-w-0">
											<p className="text-base sm:text-lg font-bold text-duo-text wrap-break-words">
												{record.exerciseName}
											</p>
											<p className="text-xs sm:text-sm text-duo-gray-dark">
												{record.date.toLocaleDateString("pt-BR")}
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
								</DuoCard>
							))}
						</div>
					</SectionCard>
				</SlideIn>
			)}

			{activeTab === "payments" && (
				<SlideIn delay={0.4}>
					<SectionCard title="Histórico de Pagamentos" icon={DollarSign}>
						<div className="mb-6 grid gap-4 md:grid-cols-3">
							<DuoCard variant="highlighted" size="sm">
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
							</DuoCard>

							<DuoCard variant="orange" size="sm">
								<div className="flex items-center gap-3">
									<AlertCircle className="h-6 w-6 text-duo-orange" />
									<div>
										<p className="text-sm font-bold text-duo-gray-dark">
											Pendentes
										</p>
										<p className="text-2xl font-bold text-duo-orange">
											{
												studentPayments.filter((p) => p.status === "pending")
													.length
											}
										</p>
									</div>
								</div>
							</DuoCard>

							<DuoCard variant="blue" size="sm">
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
							</DuoCard>
						</div>

						<div className="space-y-3">
							{studentPayments.map((payment, index) => (
								<motion.div
									key={payment.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.4 }}
								>
									<DuoCard variant="default" size="default">
										<div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<h3 className="font-bold text-duo-text text-sm sm:text-base wrap-break-words">
													{payment.planName}
												</h3>
												<p className="text-xs sm:text-sm text-duo-gray-dark mt-1">
													Vencimento:{" "}
													{payment.dueDate.toLocaleDateString("pt-BR")}
												</p>
												{payment.status === "paid" && (
													<p className="text-xs sm:text-sm text-duo-gray-dark">
														Pago em: {payment.date.toLocaleDateString("pt-BR")}
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

												<Button
													onClick={() => togglePaymentStatus(payment.id)}
													variant={
														payment.status === "paid" ? "default" : "outline"
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
												</Button>
											</div>
										</div>
									</DuoCard>
								</motion.div>
							))}
						</div>
					</SectionCard>
				</SlideIn>
			)}
		</div>
	);
}
