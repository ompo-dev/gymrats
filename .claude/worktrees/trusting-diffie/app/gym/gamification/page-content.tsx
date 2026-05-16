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
import { Card } from "@/components/ui/card";
import type { GymProfile } from "@/lib/types";

interface GymGamificationPageProps {
	profile: GymProfile;
}

export default function GymGamificationPage({
	profile,
}: GymGamificationPageProps) {
	const { gamification } = profile;

	const mockAchievements = [
		{
			id: "1",
			title: "100 Alunos Ativos",
			description: "Alcance 100 alunos ativos simultaneamente",
			icon: "👥",
			progress: 87,
			target: 100,
			xpReward: 500,
			unlocked: false,
		},
		{
			id: "2",
			title: "Sequência de 30 Dias",
			description: "Mantenha a academia aberta por 30 dias consecutivos",
			icon: "🔥",
			progress: 30,
			target: 30,
			xpReward: 300,
			unlocked: true,
		},
		{
			id: "3",
			title: "Taxa de Retenção 95%",
			description: "Mantenha uma taxa de retenção acima de 95%",
			icon: "💎",
			progress: 94,
			target: 95,
			xpReward: 1000,
			unlocked: false,
		},
		{
			id: "4",
			title: "200 Check-ins em um Dia",
			description: "Alcance 200 check-ins em um único dia",
			icon: "⚡",
			progress: 67,
			target: 200,
			xpReward: 400,
			unlocked: false,
		},
	];

	const mockRanking = [
		{ position: 1, name: "FitLife Academia", xp: 15670, city: "São Paulo" },
		{ position: 2, name: "Strong Gym", xp: 12450, city: "Rio de Janeiro" },
		{
			position: 3,
			name: "PowerFit Academia",
			xp: 2450,
			city: "São Paulo",
			isCurrentGym: true,
		},
		{ position: 4, name: "Iron Paradise", xp: 2120, city: "Belo Horizonte" },
		{ position: 5, name: "Muscle Factory", xp: 1980, city: "Curitiba" },
	];

	const progressToNextLevel =
		(gamification.xp / (gamification.xp + gamification.xpToNextLevel)) * 100;

	return (
		<div className="p-4 md:p-8">
			<div className="mb-6">
				<h1 className="text-3xl font-black text-gray-900 md:text-4xl">
					Gamificação da Academia
				</h1>
				<p className="text-sm text-gray-600 md:text-lg">
					Acompanhe suas conquistas e compare-se com outras academias
				</p>
			</div>

			<Card className="mb-6 border-2 p-6 md:p-8">
				<div className="mb-6 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#FF9600] to-[#E68A00] md:h-20 md:w-20">
							<Trophy className="h-8 w-8 text-white md:h-10 md:w-10" />
						</div>
						<div>
							<p className="text-xs font-bold text-gray-600 md:text-sm">
								Nível Atual
							</p>
							<p className="text-3xl font-black text-[#FF9600] md:text-4xl">
								{gamification.level}
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-xs font-bold text-gray-600 md:text-sm">
							Próximo Nível
						</p>
						<p className="text-3xl font-black text-gray-900 md:text-4xl">
							{gamification.level + 1}
						</p>
					</div>
				</div>

				<div className="mb-3">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-sm font-bold text-gray-700 md:text-base">
							Progresso
						</span>
						<span className="text-xs text-gray-600 md:text-sm">
							{gamification.xp} / {gamification.xp + gamification.xpToNextLevel}{" "}
							XP
						</span>
					</div>
					<div className="h-6 overflow-hidden rounded-full bg-gray-200">
						<div
							className="h-full bg-linear-to-r from-[#FF9600] to-[#E68A00] transition-all"
							style={{ width: `${progressToNextLevel}%` }}
						/>
					</div>
				</div>
				<p className="text-center text-xs text-gray-600 md:text-sm">
					Faltam{" "}
					<span className="font-bold text-[#FF9600]">
						{gamification.xpToNextLevel} XP
					</span>{" "}
					para o próximo nível
				</p>
			</Card>

			<div className="mb-6 grid gap-4 md:grid-cols-4">
				<Card className="border-2 border-[#FF9600] bg-linear-to-br from-[#FF9600]/10 to-white p-4 md:p-6">
					<div className="flex items-center gap-3">
						<Flame className="h-6 w-6 fill-[#FF9600] text-[#FF9600] md:h-8 md:w-8" />
						<div>
							<p className="text-xs font-bold text-gray-600 md:text-sm">
								Sequência
							</p>
							<p className="text-2xl font-black text-[#FF9600] md:text-3xl">
								{gamification.currentStreak}
							</p>
						</div>
					</div>
					<p className="mt-2 text-xs text-gray-600">
						Recorde: {gamification.longestStreak} dias
					</p>
				</Card>

				<Card className="border-2 border-[#CE82FF] bg-linear-to-br from-[#CE82FF]/10 to-white p-4 md:p-6">
					<div className="flex items-center gap-3">
						<TrendingUp className="h-6 w-6 text-[#CE82FF] md:h-8 md:w-8" />
						<div>
							<p className="text-xs font-bold text-gray-600 md:text-sm">
								Ranking
							</p>
							<p className="text-2xl font-black text-[#CE82FF] md:text-3xl">
								#{gamification.ranking}
							</p>
						</div>
					</div>
					<p className="mt-2 text-xs text-gray-600">
						Entre academias da região
					</p>
				</Card>

				<Card className="border-2 border-[#1CB0F6] bg-linear-to-br from-[#1CB0F6]/10 to-white p-4 md:p-6">
					<div className="flex items-center gap-3">
						<Users className="h-6 w-6 text-[#1CB0F6] md:h-8 md:w-8" />
						<div>
							<p className="text-xs font-bold text-gray-600 md:text-sm">
								Meta de Alunos
							</p>
							<p className="text-2xl font-black text-[#1CB0F6] md:text-3xl">
								{profile.totalStudents}/{gamification.monthlyStudentGoal}
							</p>
						</div>
					</div>
					<div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
						<div
							className="h-full bg-[#1CB0F6]"
							style={{
								width: `${
									(profile.totalStudents / gamification.monthlyStudentGoal) *
									100
								}%`,
							}}
						/>
					</div>
				</Card>

				<Card className="border-2 border-[#58CC02] bg-linear-to-br from-[#58CC02]/10 to-white p-4 md:p-6">
					<div className="flex items-center gap-3">
						<Target className="h-6 w-6 text-[#58CC02] md:h-8 md:w-8" />
						<div>
							<p className="text-xs font-bold text-gray-600 md:text-sm">
								Utilização
							</p>
							<p className="text-2xl font-black text-[#58CC02] md:text-3xl">
								{gamification.equipmentUtilization}%
							</p>
						</div>
					</div>
					<p className="mt-2 text-xs text-gray-600">Equipamentos em uso</p>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="border-2 p-4 md:p-6">
					<h2 className="mb-4 flex items-center gap-2 text-xl font-bold md:text-2xl">
						<Award className="h-5 w-5 text-[#FF9600] md:h-6 md:w-6" />
						Conquistas
					</h2>
					<div className="space-y-3">
						{mockAchievements.map((achievement) => (
							<div
								key={achievement.id}
								className={`rounded-xl border-2 p-4 transition-all ${
									achievement.unlocked
										? "border-[#58CC02] bg-[#58CC02]/10"
										: "border-gray-300 bg-gray-50"
								}`}
							>
								<div className="mb-3 flex items-start justify-between">
									<div className="flex items-start gap-3">
										<div className="text-2xl md:text-3xl">
											{achievement.icon}
										</div>
										<div>
											<h3 className="text-sm font-bold text-gray-900 md:text-base">
												{achievement.title}
											</h3>
											<p className="text-xs text-gray-600 md:text-sm">
												{achievement.description}
											</p>
										</div>
									</div>
									{achievement.unlocked && (
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#58CC02]">
											<Trophy className="h-4 w-4 text-white" />
										</div>
									)}
								</div>

								<div className="mb-2">
									<div className="mb-1 flex items-center justify-between text-sm">
										<span className="font-bold text-gray-700">
											{achievement.progress}/{achievement.target}
										</span>
										<span className="text-[#FF9600]">
											+{achievement.xpReward} XP
										</span>
									</div>
									<div className="h-2 overflow-hidden rounded-full bg-gray-200">
										<div
											className={`h-full ${
												achievement.unlocked ? "bg-[#58CC02]" : "bg-[#FF9600]"
											}`}
											style={{
												width: `${
													(achievement.progress / achievement.target) * 100
												}%`,
											}}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
				</Card>

				<Card className="border-2 p-4 md:p-6">
					<h2 className="mb-4 flex items-center gap-2 text-xl font-bold md:text-2xl">
						<Star className="h-5 w-5 text-[#CE82FF] md:h-6 md:w-6" />
						Ranking Regional
					</h2>
					<div className="space-y-2">
						{mockRanking.map((gym) => (
							<div
								key={gym.position}
								className={`rounded-xl border-2 p-4 transition-all ${
									gym.isCurrentGym
										? "border-[#FF9600] bg-[#FF9600]/10"
										: "border-gray-300 hover:border-[#CE82FF]"
								}`}
							>
								<div className="flex items-center gap-4">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-black md:h-12 md:w-12 md:text-xl ${
											gym.position === 1
												? "bg-linear-to-br from-[#FFD700] to-[#FFA500] text-white"
												: gym.position === 2
													? "bg-linear-to-br from-[#C0C0C0] to-[#808080] text-white"
													: gym.position === 3
														? "bg-linear-to-br from-[#CD7F32] to-[#8B4513] text-white"
														: gym.isCurrentGym
															? "bg-linear-to-br from-[#FF9600] to-[#E68A00] text-white"
															: "bg-gray-200 text-gray-700"
										}`}
									>
										{gym.position}
									</div>
									<div className="flex-1">
										<p
											className={`text-sm font-bold md:text-base ${
												gym.isCurrentGym ? "text-[#FF9600]" : "text-gray-900"
											}`}
										>
											{gym.name}
											{gym.isCurrentGym && " (Você)"}
										</p>
										<p className="text-xs text-gray-600 md:text-sm">
											{gym.city}
										</p>
									</div>
									<div className="text-right">
										<p className="text-xl font-black text-[#1CB0F6] md:text-2xl">
											{gym.xp}
										</p>
										<p className="text-xs text-gray-600">XP</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</Card>
			</div>
		</div>
	);
}
