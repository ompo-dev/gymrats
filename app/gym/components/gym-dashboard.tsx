"use client";

import { Dumbbell, Users } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { RelativeTime } from "@/components/molecules/relative-time";
import { DuoCard } from "@/components/ui/duo-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import type {
	CheckIn,
	Equipment,
	GymProfile,
	GymStats,
	StudentData,
} from "@/lib/types";

interface GymDashboardPageProps {
	profile: GymProfile;
	stats: GymStats;
	students: StudentData[];
	equipment: Equipment[];
	recentCheckIns?: CheckIn[];
}

export function GymDashboardPage({
	profile,
	stats,
	students,
	equipment,
	recentCheckIns = [],
}: GymDashboardPageProps) {
	const { today, week, month } = stats;

	const equipmentInUse = equipment.filter((eq) => eq.status === "in-use");
	const equipmentMaintenance = equipment.filter(
		(eq) => eq.status === "maintenance",
	);

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">Dashboard</h1>
					<p className="text-sm text-duo-gray-dark">
						Visão geral da sua academia em tempo real
					</p>
				</div>
			</FadeIn>

			<SlideIn delay={0.1}>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatCardLarge
						icon={Users}
						value={String(today.checkins)}
						label="Check-ins Hoje"
						subtitle={`Pico: ${today.peakHour}`}
						iconColor="duo-green"
					/>
					<StatCardLarge
						icon={Users}
						value={String(today.activeStudents)}
						label="Alunos Ativos"
						subtitle={`Total: ${profile.totalStudents}`}
						iconColor="duo-blue"
					/>
					<StatCardLarge
						icon={Dumbbell}
						value={String(today.equipmentInUse)}
						label="Equipamentos em Uso"
						subtitle={`Total: ${equipment.length}`}
						iconColor="duo-orange"
					/>
					<StatCardLarge
						icon={Users}
						value={`+${week.newMembers}`}
						label="Novos Alunos"
						subtitle="Esta semana"
						iconColor="duo-purple"
					/>
				</div>
			</SlideIn>

			<div className="grid gap-6 lg:grid-cols-2">
				<SlideIn delay={0.2}>
					<SectionCard title="Check-ins Recentes" icon={Users}>
						<div className="space-y-3">
							{recentCheckIns.map((checkin, index) => {
								const student = students.find(
									(s) => s.id === checkin.studentId,
								);
								return (
									<motion.div
										key={checkin.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05, duration: 0.4 }}
									>
										<DuoCard variant="default" size="sm" className="bg-gray-50">
											<div className="flex items-center gap-3">
												{student?.avatar && (
													<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
														<Image
															src={student.avatar || "/placeholder.svg"}
															alt={student.name}
															fill
															className="object-cover"
														/>
													</div>
												)}
												<div className="flex-1">
													<p className="text-sm font-bold text-duo-text">
														{checkin.studentName}
													</p>
													<p className="text-xs text-duo-gray-dark">
														<RelativeTime timestamp={checkin.timestamp} />
													</p>
												</div>
											</div>
										</DuoCard>
									</motion.div>
								);
							})}
						</div>
					</SectionCard>
				</SlideIn>

				<SlideIn delay={0.3}>
					<SectionCard title="Equipamentos em Tempo Real" icon={Dumbbell}>
						<div className="space-y-3">
							{equipmentInUse.map((eq, index) => (
								<motion.div
									key={eq.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.4 }}
								>
									<DuoCard variant="blue" size="sm">
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<p className="text-sm font-bold text-duo-text">
													{eq.name}
												</p>
												<p className="text-xs text-duo-gray-dark">
													{eq.currentUser?.studentName}
												</p>
											</div>
											<div className="text-right">
												<p className="text-xs text-duo-gray-dark">
													<RelativeTime timestamp={eq.currentUser?.startTime ?? new Date()} />
												</p>
											</div>
										</div>
									</DuoCard>
								</motion.div>
							))}

							{equipmentMaintenance.length > 0 && (
								<>
									<div className="my-2 border-t-2 border-duo-border" />
									<h3 className="mb-2 text-sm font-bold text-duo-text">
										Em Manutenção
									</h3>
									{equipmentMaintenance.map((eq, index) => (
										<motion.div
											key={eq.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05, duration: 0.4 }}
										>
											<DuoCard variant="orange" size="sm">
												<p className="text-sm font-bold text-duo-text">
													{eq.name}
												</p>
												<p className="text-xs text-duo-gray-dark">
													Aguardando manutenção
												</p>
											</DuoCard>
										</motion.div>
									))}
								</>
							)}
						</div>
					</SectionCard>
				</SlideIn>

				<SlideIn delay={0.4}>
					<SectionCard title="Top Alunos do Mês" icon={Users}>
						<div className="space-y-3">
							{month.topStudents.slice(0, 5).map((student, index) => {
								const variants = [
									"highlighted",
									"yellow",
									"blue",
									"default",
									"default",
								] as const;
								const variant = variants[index] || "default";
								return (
									<motion.div
										key={student.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05, duration: 0.4 }}
									>
										<DuoCard variant={variant} size="sm">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-duo-purple text-sm font-bold text-white">
													{index + 1}
												</div>
												{student.avatar && (
													<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
														<Image
															src={student.avatar || "/placeholder.svg"}
															alt={student.name}
															fill
															className="object-cover"
														/>
													</div>
												)}
												<div className="flex-1">
													<p className="text-sm font-bold text-duo-text">
														{student.name}
													</p>
													<p className="text-xs text-duo-gray-dark">
														{student.totalVisits} treinos
													</p>
												</div>
												<div className="text-right">
													<p className="text-sm font-bold text-duo-green">
														{student.attendanceRate}%
													</p>
													<p className="text-xs text-duo-gray-dark">
														frequência
													</p>
												</div>
											</div>
										</DuoCard>
									</motion.div>
								);
							})}
						</div>
					</SectionCard>
				</SlideIn>

				<SlideIn delay={0.5}>
					<SectionCard title="Estatísticas da Semana" icon={Users}>
						<div className="space-y-4">
							<DuoCard variant="highlighted" size="sm">
								<p className="text-xs font-bold text-duo-gray-dark">
									Total de Check-ins
								</p>
								<p className="text-2xl font-bold text-duo-green">
									{week.totalCheckins}
								</p>
								<div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
									<div
										className="h-full bg-duo-green"
										style={{ width: "85%" }}
									/>
								</div>
							</DuoCard>

							<DuoCard variant="blue" size="sm">
								<p className="text-xs font-bold text-duo-gray-dark">
									Média Diária
								</p>
								<p className="text-2xl font-bold text-duo-blue">
									{week.avgDailyCheckins}
								</p>
								<p className="text-xs text-duo-gray-dark">alunos por dia</p>
							</DuoCard>

							<DuoCard
								variant="default"
								size="sm"
								className="border-duo-purple bg-duo-purple/10"
							>
								<p className="text-xs font-bold text-duo-gray-dark">
									Taxa de Retenção
								</p>
								<p className="text-2xl font-bold text-duo-purple">
									{month.retentionRate}%
								</p>
								<p className="text-xs text-duo-gray-dark">últimos 30 dias</p>
							</DuoCard>
						</div>
					</SectionCard>
				</SlideIn>
			</div>
		</div>
	);
}
