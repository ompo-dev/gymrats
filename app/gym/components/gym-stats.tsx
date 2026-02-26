"use client";

import {
	Activity,
	Calendar,
	Clock,
	Dumbbell,
	Target,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/duo";
import {
	DuoSectionCard,
	DuoStatCard,
	DuoStatsGrid,
} from "@/components/duo";
import type { Equipment, GymStats } from "@/lib/types";

interface GymStatsPageProps {
	stats: GymStats;
	equipment: Equipment[];
}

export function GymStatsPage({ stats, equipment }: GymStatsPageProps) {
	const weeklyData = [
		{ day: "Seg", checkins: 58, value: 70 },
		{ day: "Ter", checkins: 62, value: 75 },
		{ day: "Qua", checkins: 71, value: 86 },
		{ day: "Qui", checkins: 68, value: 82 },
		{ day: "Sex", checkins: 75, value: 91 },
		{ day: "Sáb", checkins: 54, value: 65 },
		{ day: "Dom", checkins: 35, value: 42 },
	];

	const hourlyData = [
		{ hour: "6h", students: 12 },
		{ hour: "8h", students: 28 },
		{ hour: "10h", students: 45 },
		{ hour: "12h", students: 32 },
		{ hour: "14h", students: 25 },
		{ hour: "16h", students: 38 },
		{ hour: "18h", students: 67 },
		{ hour: "20h", students: 54 },
		{ hour: "22h", students: 18 },
	];

	const maxHourlyStudents = Math.max(...hourlyData.map((d) => d.students));

	return (
		<div className="mx-auto max-w-4xl space-y-6  ">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">
						Estatísticas Detalhadas
					</h1>
					<p className="text-sm text-duo-gray-dark">
						Análise completa do desempenho da academia
					</p>
				</div>
			</FadeIn>

			<SlideIn delay={0.1}>
				<DuoStatsGrid columns={2} className="gap-4">
					<DuoStatCard
						icon={Users}
						value={String(stats.week.totalCheckins)}
						label="Check-ins Semana"
						badge="+8%"
						iconColor="var(--duo-secondary)"
					/>
					<DuoStatCard
						icon={Activity}
						value={`${stats.month.retentionRate}%`}
						label="Taxa Retenção"
						badge="+5%"
						iconColor="var(--duo-primary)"
					/>
					<DuoStatCard
						icon={Target}
						value={String(stats.week.avgDailyCheckins)}
						label="Média Diária"
						badge="85%"
						iconColor="#A560E8"
					/>
					<DuoStatCard
						icon={Dumbbell}
						value={String(equipment.length)}
						label="Equipamentos Ativos"
						badge="78%"
						iconColor="var(--duo-accent)"
					/>
				</DuoStatsGrid>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoSectionCard
					title="Check-ins por Dia"
					icon={Calendar}
					variant="highlighted"
				>
					<div className="space-y-3">
						{weeklyData.map((day, index) => (
							<motion.div
								key={day.day}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05, duration: 0.4 }}
							>
								<div className="space-y-1">
									<div className="flex items-center justify-between text-sm">
										<span className="font-bold text-duo-gray-dark">
											{day.day}
										</span>
										<span className="font-bold text-duo-text">
											{day.checkins}
										</span>
									</div>
									<div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
										<div
											className="h-full rounded-full bg-duo-green transition-all"
											style={{ width: `${day.value}%` }}
										/>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</DuoSectionCard>
			</SlideIn>

			<SlideIn delay={0.3}>
				<DuoSectionCard title="Horários Populares" icon={Clock} variant="orange">
					<div className="space-y-2">
						{hourlyData.map((item, index) => (
							<motion.div
								key={item.hour}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.05, duration: 0.4 }}
							>
								<div className="flex items-center gap-3">
									<div className="w-8 text-xs font-bold text-duo-gray-dark">
										{item.hour}
									</div>
									<div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-gray-100">
										<div
											className="flex h-full items-center rounded-lg bg-duo-orange px-2 text-xs font-bold text-white transition-all"
											style={{
												width: `${(item.students / maxHourlyStudents) * 100}%`,
											}}
										>
											{item.students > 15 && item.students}
										</div>
									</div>
									<div className="w-8 text-right text-xs font-bold text-duo-text">
										{item.students}
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</DuoSectionCard>
			</SlideIn>

			<SlideIn delay={0.4}>
				<DuoSectionCard
					title="Equipamentos Mais Usados"
					icon={Dumbbell}
					variant="blue"
				>
					<div className="space-y-3">
						{equipment.slice(0, 5).map((eq: Equipment, index: number) => (
							<motion.div
								key={eq.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05, duration: 0.4 }}
							>
								<DuoCard variant="default" size="sm">
									<div className="flex items-center gap-3">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-duo-blue text-sm font-bold text-white">
											{index + 1}
										</div>
										<div className="flex-1">
											<div className="text-sm font-bold text-duo-text">
												{eq.name}
											</div>
											<div className="text-xs text-duo-gray-dark">
												{eq.usageStats.totalUses} usos
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm font-bold text-duo-blue">
												{eq.usageStats.avgUsageTime}min
											</div>
											<div className="text-xs text-duo-gray-dark">média</div>
										</div>
									</div>
								</DuoCard>
							</motion.div>
						))}
					</div>
				</DuoSectionCard>
			</SlideIn>
		</div>
	);
}
