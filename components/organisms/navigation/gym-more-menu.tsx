"use client";

import {
	BarChart3,
	Crown,
	type LucideIcon,
	Settings,
	Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { parseAsString, useQueryState } from "nuqs";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card"; // Componente específico - manter em ui/

interface MoreMenuItem {
	id: string;
	icon: LucideIcon;
	label: string;
	description: string;
	color: "duo-blue" | "duo-yellow" | "duo-green";
}

const moreMenuItems: MoreMenuItem[] = [
	{
		id: "stats",
		icon: BarChart3,
		label: "Estatísticas",
		description: "Análises detalhadas e relatórios",
		color: "duo-blue",
	},
	{
		id: "settings",
		icon: Settings,
		label: "Configurações",
		description: "Perfil, planos e preferências",
		color: "duo-green",
	},
	{
		id: "gamification",
		icon: Trophy,
		label: "Gamificação",
		description: "XP, rankings e conquistas",
		color: "duo-yellow",
	},
	{
		id: "subscription",
		icon: Crown,
		label: "Assinatura",
		description: "Gerencie sua assinatura",
		color: "duo-green",
	},
];

export function GymMoreMenu() {
	const [, setTab] = useQueryState("tab", parseAsString);
	const [, setView] = useQueryState(
		"view",
		parseAsString.withDefault("overview"),
	);
	const [, setSubTab] = useQueryState("subTab", parseAsString);

	const handleItemClick = async (itemId: string) => {
		if (itemId === "subscription") {
			await setTab("financial");
			await setView("subscription");
			await setSubTab("subscription");
			return;
		}
		await setTab(itemId);
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">Mais</h1>
					<p className="text-sm text-duo-gray-dark">
						Acesse todas as funcionalidades
					</p>
				</div>
			</FadeIn>

			<SlideIn delay={0.1}>
				<div className="grid gap-4">
					{moreMenuItems.map((item, index) => (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1, duration: 0.4 }}
						>
							<NavigationButtonCard
								icon={item.icon}
								title={item.label}
								description={item.description}
								color={item.color}
								onClick={() => handleItemClick(item.id)}
							/>
						</motion.div>
					))}
				</div>
			</SlideIn>
		</div>
	);
}
