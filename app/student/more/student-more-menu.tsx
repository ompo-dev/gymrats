"use client";

import {
	BarChart3,
	BookOpen,
	Crown,
	type LucideIcon,
	Palette,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { parseAsString, useQueryState } from "nuqs";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { NavigationButtonCard } from "@/components/ui/navigation-button-card";
import { useUserSession } from "@/hooks/use-user-session";

interface MoreMenuItem {
	id: string;
	icon: LucideIcon;
	label: string;
	description: string;
	color: "duo-red" | "duo-green" | "duo-blue" | "duo-purple" | "duo-yellow";
	adminOnly?: boolean;
}

const moreMenuItems: MoreMenuItem[] = [
	{
		id: "home",
		icon: BarChart3,
		label: "Estatísticas",
		description: "Resumo e evolução",
		color: "duo-blue",
	},
	{
		id: "profile",
		icon: Settings,
		label: "Configurações",
		description: "Perfil e preferências",
		color: "duo-green",
	},
	{
		id: "subscription",
		icon: Crown,
		label: "Assinatura",
		description: "Gerencie sua assinatura",
		color: "duo-yellow",
	},
	{
		id: "education",
		icon: BookOpen,
		label: "Aprender",
		description: "Anatomia, lições e quizzes",
		color: "duo-purple",
		adminOnly: true,
	},
	{
		id: "theme-test",
		icon: Palette,
		label: "Teste de Tema",
		description: "Tabs, cards, stats e color picker",
		color: "duo-yellow",
		adminOnly: true,
	},
];

export function StudentMoreMenu() {
	const [, setTab] = useQueryState("tab", parseAsString.withDefault("home"));
	const [, setSubTab] = useQueryState(
		"subTab",
		parseAsString.withDefault("memberships"),
	);
	const { isAdmin, role } = useUserSession();
	const userIsAdmin = isAdmin || role === "ADMIN";

	const visibleMenuItems = moreMenuItems.filter(
		(item) => !item.adminOnly || userIsAdmin,
	);

	const handleItemClick = async (itemId: string) => {
		if (itemId === "theme-test") return;
		if (itemId === "subscription") {
			await setTab("payments");
			await setSubTab("subscription");
			return;
		}
		if (itemId === "home") {
			await setTab("home");
			return;
		}
		setTab(itemId);
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
					{visibleMenuItems.map((item, index) => (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1, duration: 0.4 }}
						>
							{item.id === "theme-test" ? (
								<Link href="/student/theme-test">
									<NavigationButtonCard
										icon={item.icon}
										title={item.label}
										description={item.description}
										color={item.color}
									/>
								</Link>
							) : (
								<NavigationButtonCard
									icon={item.icon}
									title={item.label}
									description={item.description}
									color={item.color}
									onClick={() => handleItemClick(item.id)}
								/>
							)}
						</motion.div>
					))}
				</div>
			</SlideIn>
		</div>
	);
}
