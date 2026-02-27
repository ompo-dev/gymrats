"use client";

import { Dumbbell, Flame, Target } from "lucide-react";
import { DuoAchievementCard } from "@/components/duo";

const ACHIEVEMENTS = [
	{
		icon: Dumbbell,
		title: "Primeiro Treino",
		description: "Complete seu primeiro treino",
		current: 1,
		total: 1,
		level: 1,
	},
	{
		icon: Target,
		title: "Meta Semanal",
		description: "Complete 5 treinos esta semana",
		current: 3,
		total: 5,
		level: 2,
	},
	{
		icon: Flame,
		title: "Streak de 7 dias",
		description: "Treine 7 dias seguidos",
		current: 2,
		total: 7,
	},
];

export function AchievementCardsSection() {
	return (
		<div className="space-y-3">
			{ACHIEVEMENTS.map((achievement) => (
				<DuoAchievementCard.Simple
					key={achievement.title}
					icon={achievement.icon}
					title={achievement.title}
					description={achievement.description}
					current={achievement.current}
					total={achievement.total}
					level={achievement.level}
				/>
			))}
		</div>
	);
}
