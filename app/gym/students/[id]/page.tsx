"use client";

import {
	Activity,
	AlertCircle,
	Apple,
	ArrowLeft,
	Calendar,
	CheckCircle,
	DollarSign,
	Dumbbell,
	Edit,
	Flame,
	Mail,
	Phone,
	Target,
	TrendingUp,
	Trophy,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/duo";
import {
	DuoSectionCard,
	DuoStatCard,
	DuoStatsGrid,
} from "@/components/duo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPayments, mockStudents } from "@/lib/gym-mock-data";
import { cn } from "@/lib/utils";

export default function StudentDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const student = mockStudents.find((s) => s.id === id);
	const [studentPayments, setStudentPayments] = useState(
		mockPayments.filter((p) => p.studentId === id),
	);

	if (!student) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<FadeIn>
					<DuoSectionCard
						title="Aluno não encontrado"
						icon={AlertCircle}
						className="text-center"
					>
						<p className="mb-4 text-xl font-bold text-duo-gray-dark">
							Aluno não encontrado
						</p>
						<Link href="/gym/students">
							<Button className="mt-4">Voltar para Alunos</Button>
						</Link>
					</DuoSectionCard>
				</FadeIn>
			</div>
		);
	}

	const togglePaymentStatus = (paymentId: string) => {
		setStudentPayments((prev) =>
			prev.map((p) => {
				if (p.id === paymentId) {
					return {
						...p,
						status: p.status === "paid" ? "pending" : "paid",
						date: p.status === "paid" ? p.date : new Date(),
					};
				}
				return p;
			}),
		);
	};

	return (
		<div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<FadeIn>
				<Link href="/gym/students">
					<Button variant="ghost" className="mb-4 gap-2 font-bold">
						<ArrowLeft className="h-4 w-4" />
						Voltar para Alunos
					</Button>
				</Link>
			</FadeIn>

			<SlideIn delay={0.1}>
				<DuoSectionCard title={student.name} icon={Calendar} variant="highlighted">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
						<div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full">
							<Image
								src={student.avatar || "/placeholder.svg"}
								alt={student.name}
								fill
								className="object-cover"
							/>
						</div>
						<div className="flex-1">
							<div className="mb-2 flex items-center gap-3">
								<span
									className={cn(
										"rounded-full px-3 py-1 text-sm font-bold",
										student.membershipStatus === "active"
											? "bg-duo-green text-white"
											: "bg-duo-gray text-duo-gray-dark",
									)}
								>
									{student.membershipStatus === "active" ? "Ativo" : "Inativo"}
								</span>
							</div>
							<div className="mb-4 space-y-1 text-duo-gray-dark">
								<div className="flex items-center gap-2">
									<Mail className="h-4 w-4" />
									<span>{student.email}</span>
								</div>
								<div className="flex items-center gap-2">
									<Phone className="h-4 w-4" />
									<span>{student.phone}</span>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									<span>
										Membro desde {student.joinDate.toLocaleDateString("pt-BR")}
									</span>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button className="gap-2">
									<Edit className="h-4 w-4" />
									Editar Perfil
								</Button>
								<Button variant="outline" className="gap-2">
									<Dumbbell className="h-4 w-4" />
									Atribuir Treino
								</Button>
								<Button variant="outline" className="gap-2">
									<Apple className="h-4 w-4" />
									Atribuir Dieta
								</Button>
							</div>
						</div>
					</div>
				</DuoSectionCard>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoStatsGrid columns={4}>
					<DuoStatCard
						icon={Flame}
						value={String(student.currentStreak)}
						label="Sequência"
						iconColor="var(--duo-accent)"
					/>
					<DuoStatCard
						icon={Trophy}
						value={String(student.progress.currentLevel)}
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
				<Tabs defaultValue="overview" className="space-y-6">
					<TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
						<TabsTrigger value="overview">Visão Geral</TabsTrigger>
						<TabsTrigger value="workouts">Treinos</TabsTrigger>
						<TabsTrigger value="diet">Dieta</TabsTrigger>
						<TabsTrigger value="progress">Progresso</TabsTrigger>
						<TabsTrigger value="records">Recordes</TabsTrigger>
						<TabsTrigger value="payments">Pagamentos</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<div className="grid gap-6 lg:grid-cols-2">
							<DuoSectionCard title="Informações do Perfil" icon={Calendar}>
								<div className="space-y-3">
									{[
										{ label: "Idade", value: `${student.age} anos` },
										{
											label: "Gênero",
											value: student.gender === "male" ? "Masculino" : "Feminino",
										},
										{ label: "Altura", value: `${student.profile.height}cm` },
										{ label: "Peso Atual", value: `${student.currentWeight}kg` },
										{
											label: "Nível",
											value: student.profile.fitnessLevel,
										},
										{
											label: "Frequência Semanal",
											value: `${student.profile.weeklyWorkoutFrequency}x semana`,
										},
									].map((item) => (
										<DuoCard key={item.label} variant="default" size="sm">
											<div className="flex justify-between">
												<span className="font-bold text-duo-gray-dark">
													{item.label}
												</span>
												<span className="font-bold text-duo-text capitalize">
													{item.value}
												</span>
											</div>
										</DuoCard>
									))}
								</div>
							</DuoSectionCard>

							<DuoSectionCard title="Objetivos" icon={Target} variant="blue">
								<div className="space-y-2">
									{student.profile.goals.map((goal) => (
										<DuoCard
											key={goal}
											variant="highlighted"
											size="sm"
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
												<span className="text-sm text-duo-gray-dark">
													{equipment}
												</span>
											</div>
										</DuoCard>
									))}
								</div>
							</DuoSectionCard>

							<DuoSectionCard
								title="Evolução de Peso"
								icon={Calendar}
								className="lg:col-span-2"
							>
								<div className="space-y-2">
									{student.weightHistory.map((record, idx) => (
										<DuoCard key={`${record.date.toISOString()}-${record.weight}`} variant="default" size="sm">
											<div className="flex items-center gap-4">
												<Calendar className="h-5 w-5 shrink-0 text-duo-gray-dark" />
												<span className="flex-1 font-bold text-duo-text">
													{record.date.toLocaleDateString("pt-BR")}
												</span>
												<span className="text-2xl font-bold text-duo-blue">
													{record.weight}kg
												</span>
												{idx < student.weightHistory.length - 1 && (
													<div className="flex items-center gap-1">
														{record.weight <
														student.weightHistory[idx + 1].weight ? (
															<>
																<TrendingUp className="h-4 w-4 text-duo-red" />
																<span className="text-sm font-bold text-duo-red">
																	+
																	{(
																		record.weight -
																		student.weightHistory[idx + 1].weight
																	).toFixed(1)}
																	kg
																</span>
															</>
														) : (
															<>
																<TrendingUp className="h-4 w-4 rotate-180 text-duo-green" />
																<span className="text-sm font-bold text-duo-green">
																	{(
																		record.weight -
																		student.weightHistory[idx + 1].weight
																	).toFixed(1)}
																	kg
																</span>
															</>
														)}
													</div>
												)}
											</div>
										</DuoCard>
									))}
								</div>
							</DuoSectionCard>
						</div>
					</TabsContent>

					<TabsContent value="workouts">
						<DuoSectionCard title="Histórico de Treinos" icon={Activity}>
							<p className="text-duo-gray-dark">
								Implementação do histórico de treinos em desenvolvimento...
							</p>
						</DuoSectionCard>
					</TabsContent>

					<TabsContent value="diet">
						<DuoSectionCard title="Plano de Dieta" icon={Apple} variant="orange">
							<div className="space-y-4">
								<DuoCard variant="orange" size="default">
									<p className="font-bold text-duo-gray-dark">
										Meta Calórica Diária
									</p>
									<p className="text-3xl font-bold text-duo-orange">
										{student.profile.targetCalories} kcal
									</p>
								</DuoCard>
								<DuoStatsGrid columns={3}>
									<DuoStatCard
										icon={Target}
										value={`${student.profile.targetProtein}g`}
										label="Proteína"
										iconColor="var(--duo-primary)"
									/>
									<DuoStatCard
										icon={Target}
										value={`${student.profile.targetCarbs || 250}g`}
										label="Carboidratos"
										iconColor="var(--duo-secondary)"
									/>
									<DuoStatCard
										icon={Target}
										value={`${student.profile.targetFats || 70}g`}
										label="Gorduras"
										iconColor="#A560E8"
									/>
								</DuoStatsGrid>
							</div>
						</DuoSectionCard>
					</TabsContent>

					<TabsContent value="progress">
						<DuoSectionCard title="Progresso e XP" icon={Trophy} variant="highlighted">
							<div className="mb-6">
								<div className="mb-2 flex items-center justify-between">
									<span className="font-bold text-duo-text">
										Nível {student.progress.currentLevel}
									</span>
									<span className="text-sm text-duo-gray-dark">
										{student.progress.totalXP} /{" "}
										{student.progress.totalXP + student.progress.xpToNextLevel}{" "}
										XP
									</span>
								</div>
								<div className="h-4 overflow-hidden rounded-full bg-duo-gray">
									<div
										className="h-full bg-duo-green transition-all"
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
							<h3 className="mb-3 font-bold text-duo-text">
								Atividade Semanal
							</h3>
							<div className="grid grid-cols-7 gap-2">
								{(["D", "S", "T", "Q", "Q", "S", "S"] as const).map(
									(day, idx) => (
										<div key={day} className="text-center">
											<p className="mb-2 text-xs font-bold text-duo-gray-dark">
												{day}
											</p>
											<DuoCard variant="highlighted" size="sm">
												<p className="text-lg font-bold text-duo-green">
													{student.progress.weeklyXP[idx]}
												</p>
											</DuoCard>
										</div>
									),
								)}
							</div>
						</DuoSectionCard>
					</TabsContent>

					<TabsContent value="records">
						<DuoSectionCard title="Recordes Pessoais" icon={Trophy} variant="orange">
							<div className="space-y-3">
								{student.personalRecords.map((record) => (
									<DuoCard
										key={`${record.exerciseName}-${record.date.toISOString()}-${record.value}`}
										variant="orange"
										size="default"
									>
										<div className="flex items-center justify-between">
											<div>
												<p className="text-lg font-bold text-duo-text">
													{record.exerciseName}
												</p>
												<p className="text-sm text-duo-gray-dark">
													{record.date.toLocaleDateString("pt-BR")}
												</p>
											</div>
											<div className="text-right">
												<p className="text-3xl font-bold text-duo-orange">
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
						</DuoSectionCard>
					</TabsContent>

					<TabsContent value="payments">
						<DuoSectionCard
							title="Histórico de Pagamentos"
							icon={DollarSign}
							variant="blue"
						>
							<DuoStatsGrid columns={3}>
								<DuoStatCard
									icon={CheckCircle}
									value={String(
										studentPayments.filter((p) => p.status === "paid").length,
									)}
									label="Pagos"
									iconColor="var(--duo-primary)"
								/>
								<DuoStatCard
									icon={AlertCircle}
									value={String(
										studentPayments.filter((p) => p.status === "pending")
											.length,
									)}
									label="Pendentes"
									iconColor="var(--duo-accent)"
								/>
								<DuoStatCard
									icon={DollarSign}
									value={`R$ ${studentPayments
										.filter((p) => p.status === "paid")
										.reduce((sum, p) => sum + p.amount, 0)
										.toFixed(2)}`}
									label="Total Pago"
									iconColor="var(--duo-secondary)"
								/>
							</DuoStatsGrid>
							<div className="space-y-3">
								{studentPayments.map((payment) => (
									<DuoCard key={payment.id} variant="default" size="default">
										<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
											<div className="flex-1">
												<h3 className="font-bold text-duo-text">
													{payment.planName}
												</h3>
												<p className="mt-1 text-sm text-duo-gray-dark">
													Vencimento:{" "}
													{payment.dueDate.toLocaleDateString("pt-BR")}
												</p>
												{payment.status === "paid" && (
													<p className="text-sm text-duo-gray-dark">
														Pago em:{" "}
														{payment.date.toLocaleDateString("pt-BR")}
													</p>
												)}
												<p className="text-sm capitalize text-duo-gray-dark">
													Método: {payment.paymentMethod.replace("-", " ")}
												</p>
											</div>
											<div className="flex flex-col items-end gap-2">
												<p className="text-2xl font-bold text-duo-blue">
													R$ {payment.amount.toFixed(2)}
												</p>
												<Button
													size="sm"
													variant={
														payment.status === "paid" ? "secondary" : "default"
													}
													onClick={() => togglePaymentStatus(payment.id)}
												>
													{payment.status === "paid" ? (
														<>
															<CheckCircle className="h-4 w-4" />
															Pago
														</>
													) : (
														<>
															<XCircle className="h-4 w-4" />
															Marcar como Pago
														</>
													)}
												</Button>
											</div>
										</div>
									</DuoCard>
								))}
							</div>
						</DuoSectionCard>
					</TabsContent>
				</Tabs>
			</SlideIn>
		</div>
	);
}
