"use client";

import { Bell, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { DuoCard } from "@/components/duo";
import { cn } from "@/lib/utils";

const SETTINGS = [
	{
		icon: Users,
		title: "Gerenciar Equipe",
		description: "Adicionar e remover funcionários",
		color: "duo-purple",
	},
	{
		icon: Bell,
		title: "Notificações",
		description: "Configurar alertas e lembretes",
		color: "duo-yellow",
	},
	{
		icon: Shield,
		title: "Privacidade e Segurança",
		description: "Gerencie dados e permissões",
		color: "duo-red",
	},
] as const;

export function GymSettingsOtherCard() {
	return (
		<DuoCard.Root variant="default" padding="md">
			<DuoCard.Header>
				<div className="flex items-center gap-2">
					<Shield
						className="h-5 w-5 shrink-0 text-duo-secondary"
						aria-hidden
					/>
					<h2 className="font-bold text-duo-fg">
						Outras Configurações
					</h2>
				</div>
			</DuoCard.Header>
			<div className="space-y-3">
				{SETTINGS.map((setting, index) => (
					<motion.div
						key={setting.title}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05, duration: 0.4 }}
					>
						<DuoCard.Root
							variant="default"
							size="default"
							className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
						>
							<div className="flex items-center gap-3">
								<div
									className={cn(
										"rounded-xl p-3",
										setting.color === "duo-purple" && "bg-duo-purple/10",
										setting.color === "duo-yellow" && "bg-duo-yellow/10",
										setting.color === "duo-red" && "bg-duo-red/10",
									)}
								>
									{setting.color === "duo-purple" && (
										<Users className="h-5 w-5 text-duo-purple" />
									)}
									{setting.color === "duo-yellow" && (
										<Bell className="h-5 w-5 text-duo-yellow" />
									)}
									{setting.color === "duo-red" && (
										<Shield className="h-5 w-5 text-duo-red" />
									)}
								</div>
								<div className="flex-1 text-left">
									<div className="text-sm font-bold text-duo-fg">
										{setting.title}
									</div>
									<div className="text-xs text-duo-fg-muted">
										{setting.description}
									</div>
								</div>
							</div>
						</DuoCard.Root>
					</motion.div>
				))}
			</div>
		</DuoCard.Root>
	);
}
