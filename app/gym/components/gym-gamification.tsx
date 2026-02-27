"use client";

import {
	Award,
	Flame,
	Star,
	Target,
	TrendingUp,
	Trophy,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard } from "@/components/duo";
import {
	DuoStatCard,
	DuoStatsGrid,
} from "@/components/duo";
import type { GymProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GymGamificationPageProps {
	profile: GymProfile;
}

export function GymGamificationPage({ profile }: GymGamificationPageProps) {
	const { gamification } = profile;

	const achievements = gamification.achievements ?? [];
	const ranking = [
		{
			position: gamification.ranking ?? 0,
			name: profile.name,
			xp: gamification.xp,
			city: profile.address?.split(",")[1]?.trim() ?? "—",
			isCurrentGym: true,
		},
	];

	const progressToNextLevel =
		(gamification.xp / (gamification.xp + gamification.xpToNextLevel)) * 100;

	return (
		<div className="mx-auto max-w-4xl space-y-6  ">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">
						Gamificação da Academia
					</h1>
					<p className="text-sm text-duo-gray-dark">
						Acompanhe suas conquistas e compare-se com outras academias
					</p>
				</div>
			</FadeIn>

			<SlideIn delay={0.1}>
				<DuoCard.Root variant="orange" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<Trophy className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">Nível e Progresso</h2>
						</div>
					</DuoCard.Header>
					<div className="mb-6 flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-duo-orange">
								<Trophy className="h-8 w-8 text-white" />
							</div>
							<div>
								<p className="text-xs font-bold text-duo-gray-dark">
									Nível Atual
								</p>
								<p className="text-3xl font-bold text-duo-orange">
									{gamification.level}
								</p>
							</div>
						</div>
						<div className="text-right">
							<p className="text-xs font-bold text-duo-gray-dark">
								Próximo Nível
							</p>
							<p className="text-3xl font-bold text-duo-text">
								{gamification.level + 1}
							</p>
						</div>
					</div>

					<div className="mb-3">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-bold text-duo-text">Progresso</span>
							<span className="text-xs text-duo-gray-dark">
								{gamification.xp} /{" "}
								{gamification.xp + gamification.xpToNextLevel} XP
							</span>
						</div>
						<div className="h-6 overflow-hidden rounded-full bg-gray-200">
							<div
								className="h-full bg-duo-orange transition-all"
								style={{ width: `${progressToNextLevel}%` }}
							/>
						</div>
					</div>
					<p className="text-center text-xs text-duo-gray-dark">
						Faltam{" "}
						<span className="font-bold text-duo-orange">
							{gamification.xpToNextLevel} XP
						</span>{" "}
						para o próximo nível
					</p>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoStatsGrid.Root columns={4} className="gap-4">
					<DuoStatCard.Simple
						icon={Flame}
						value={String(gamification.currentStreak)}
						label="Sequência"
						badge={`Recorde: ${gamification.longestStreak} dias`}
						iconColor="var(--duo-accent)"
					/>
					<DuoStatCard.Simple
						icon={TrendingUp}
						value={`#${gamification.ranking}`}
						label="Ranking"
						badge="Entre academias da região"
						iconColor="#A560E8"
					/>
					<DuoStatCard.Simple
						icon={Users}
						value={`${profile.totalStudents}/${gamification.monthlyStudentGoal}`}
						label="Meta de Alunos"
						iconColor="var(--duo-secondary)"
					/>
					<DuoStatCard.Simple
						icon={Target}
						value={`${gamification.equipmentUtilization}%`}
						label="Utilização"
						badge="Equipamentos em uso"
						iconColor="var(--duo-primary)"
					/>
				</DuoStatsGrid.Root>
			</SlideIn>

			<div className="grid gap-6 lg:grid-cols-2">
				<SlideIn delay={0.3}>
					<DuoCard.Root variant="orange" padding="md">
						<DuoCard.Header>
							<div className="flex items-center gap-2">
								<Award className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
								<h2 className="font-bold text-[var(--duo-fg)]">Conquistas</h2>
							</div>
						</DuoCard.Header>
						<div className="space-y-3">
							{achievements.length === 0 ? (
								<DuoCard.Root variant="default" size="default" className="p-8 text-center">
									<Award className="mx-auto mb-3 h-10 w-10 text-duo-gray-dark opacity-40" />
									<p className="font-bold text-duo-gray-dark">Nenhuma conquista ainda</p>
									<p className="mt-1 text-sm text-duo-gray-dark">
										As conquistas aparecerão conforme você atingir metas da academia.
									</p>
								</DuoCard.Root>
							) : (
								achievements.map((achievement, index) => {
									const unlocked = !!achievement.unlockedAt;
									const progress = achievement.progress ?? 0;
									const target = achievement.target ?? 100;
									return (
										<motion.div
											key={achievement.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05, duration: 0.4 }}
										>
											<DuoCard.Root
												variant={unlocked ? "highlighted" : "default"}
												size="default"
												className={cn(
													unlocked && "border-duo-green bg-duo-green/10",
												)}
											>
												<div className="mb-3 flex items-start justify-between">
													<div className="flex items-start gap-3">
														<div className="text-2xl">{achievement.icon}</div>
														<div>
															<h3 className="text-sm font-bold text-duo-text">
																{achievement.title}
															</h3>
															<p className="text-xs text-duo-gray-dark">
																{achievement.description}
															</p>
														</div>
													</div>
													{unlocked && (
														<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-duo-green">
															<Trophy className="h-4 w-4 text-white" />
														</div>
													)}
												</div>

												{target > 0 && (
													<div className="mb-2">
														<div className="mb-1 flex items-center justify-between text-sm">
															<span className="font-bold text-duo-text">
																{progress}/{target}
															</span>
														</div>
														<div className="h-2 overflow-hidden rounded-full bg-gray-200">
															<div
																className={cn(
																	"h-full",
																	unlocked ? "bg-duo-green" : "bg-duo-orange",
																)}
																style={{
																	width: `${Math.min((progress / target) * 100, 100)}%`,
																}}
															/>
														</div>
													</div>
												)}
											</DuoCard.Root>
										</motion.div>
									);
								})
							)}
						</div>
					</DuoCard.Root>
				</SlideIn>

				<SlideIn delay={0.4}>
					<DuoCard.Root variant="default" padding="md">
						<DuoCard.Header>
							<div className="flex items-center gap-2">
								<Star className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
								<h2 className="font-bold text-[var(--duo-fg)]">Ranking Regional</h2>
							</div>
						</DuoCard.Header>
						<p className="mb-4 text-sm font-medium text-duo-text">
							Sua academia • Posição {(gamification.ranking ?? 0) > 0 ? `#${gamification.ranking}` : "—"}
						</p>
						<div className="space-y-2">
							{ranking.map((gym, index) => (
								<motion.div
									key={`${gym.name}-${index}`}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.4 }}
								>
									<DuoCard.Root
										variant="default"
										size="default"
										className={cn(
											gym.isCurrentGym && "border-duo-orange bg-duo-orange/10",
										)}
									>
										<div className="flex items-center gap-4">
											<div
												className={cn(
													"flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
													gym.position === 1 && "bg-duo-yellow text-white",
													gym.position === 2 && "bg-gray-400 text-white",
													gym.position === 3 && "bg-duo-orange text-white",
													gym.isCurrentGym &&
														gym.position > 3 &&
														"bg-duo-orange text-white",
													!gym.isCurrentGym &&
														gym.position > 3 &&
														"bg-gray-200 text-duo-gray-dark",
												)}
											>
												{gym.position}
											</div>
											<div className="flex-1">
												<p
													className={cn(
														"text-sm font-bold",
														gym.isCurrentGym
															? "text-duo-orange"
															: "text-duo-text",
													)}
												>
													{gym.name}
													{gym.isCurrentGym && " (Você)"}
												</p>
												<p className="text-xs text-duo-gray-dark">{gym.city}</p>
											</div>
											<div className="text-right">
												<p className="text-xl font-bold text-duo-blue">
													{gym.xp}
												</p>
												<p className="text-xs text-duo-gray-dark">XP</p>
											</div>
										</div>
									</DuoCard.Root>
								</motion.div>
							))}
						</div>
					</DuoCard.Root>
				</SlideIn>
			</div>
		</div>
	);
}
