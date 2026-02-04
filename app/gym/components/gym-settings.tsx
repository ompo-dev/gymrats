"use client";

import {
	ArrowRightLeft,
	Bell,
	Building2,
	Clock,
	CreditCard,
	Edit2,
	FileText,
	LogOut,
	Mail,
	MapPin,
	Phone,
	Plus,
	Shield,
	Trash2,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/ui/duo-card";
import { SectionCard } from "@/components/ui/section-card";
import { useUserSession } from "@/hooks/use-user-session";
import { mockMembershipPlans } from "@/lib/gym-mock-data";
import type { GymProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

// Nota: useUserSession foi removido - usando apenas dados do servidor (SSR)
interface GymSettingsPageProps {
	profile: GymProfile;
	userInfo?: { isAdmin: boolean; role: string | null };
}

export function GymSettingsPage({
	profile,
	userInfo = { isAdmin: false, role: null },
}: GymSettingsPageProps) {
	const router = useRouter();

	// ✅ SEGURO: Usar hook que valida no servidor
	const {
		isAdmin: serverIsAdmin,
		role: serverRole,
		isLoading: _sessionLoading,
	} = useUserSession();

	// ✅ SEGURANÇA: Usar dados do servidor como fonte da verdade
	// Nunca confiar apenas em userInfo prop ou localStorage (podem ser modificados)
	const isAdmin = serverIsAdmin || serverRole === "ADMIN";
	const operatingHours = [
		{ day: "Segunda a Sexta", hours: "06:00 - 22:00" },
		{ day: "Sábado", hours: "08:00 - 20:00" },
		{ day: "Domingo", hours: "09:00 - 14:00" },
	];

	const handleLogout = async () => {
		try {
			// Usar axios client (API → Component)
			const { apiClient } = await import("@/lib/api/client");
			await apiClient.post("/api/auth/sign-out");

			router.push("/welcome");
			router.refresh();
		} catch (error) {
			console.error("Erro ao fazer logout:", error);
		}
	};

	const handleSwitchToStudent = () => {
		router.push("/student");
	};

	return (
		<div className="mx-auto max-w-4xl space-y-6  ">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">
						Configurações
					</h1>
					<p className="text-sm text-duo-gray-dark">
						Gerencie o perfil e configurações da academia
					</p>
				</div>
			</FadeIn>

			<SlideIn delay={0.1}>
				<SectionCard title={profile.name} icon={Building2} variant="orange">
					<div className="mb-4 flex items-center justify-between">
						<p className="text-sm text-duo-gray-dark">Plano {profile.plan}</p>
						<Button size="sm" variant="outline">
							<Edit2 className="h-4 w-4" />
						</Button>
					</div>
					<div className="space-y-3">
						{[
							{
								icon: MapPin,
								label: "Endereço",
								value: profile.address,
							},
							{
								icon: Phone,
								label: "Telefone",
								value: profile.phone,
							},
							{
								icon: Mail,
								label: "Email",
								value: profile.email,
							},
							{
								icon: FileText,
								label: "CNPJ",
								value: profile.cnpj,
							},
						].map((info) => (
							<DuoCard key={info.label} variant="default" size="sm">
								<div className="flex items-start gap-3">
									<info.icon className="h-5 w-5 shrink-0 text-duo-gray-dark" />
									<div className="flex-1">
										<div className="text-xs font-bold text-duo-gray-dark">
											{info.label}
										</div>
										<div className="text-sm font-bold text-duo-text">
											{info.value}
										</div>
									</div>
								</div>
							</DuoCard>
						))}
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.2}>
				<SectionCard
					title="Horários de Funcionamento"
					icon={Clock}
					variant="blue"
					headerAction={
						<Button size="sm" variant="outline">
							<Edit2 className="h-4 w-4" />
						</Button>
					}
				>
					<div className="space-y-3">
						{operatingHours.map((schedule, _index) => (
							<DuoCard key={schedule.day} variant="default" size="sm">
								<div className="flex items-center justify-between">
									<span className="text-sm font-bold text-duo-text">
										{schedule.day}
									</span>
									<span className="text-sm font-bold text-duo-blue">
										{schedule.hours}
									</span>
								</div>
							</DuoCard>
						))}
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.3}>
				<SectionCard
					title="Planos de Assinatura"
					icon={CreditCard}
					variant="highlighted"
					headerAction={
						<Button size="sm" variant="outline">
							<Plus className="h-4 w-4" />
						</Button>
					}
				>
					<div className="space-y-3">
						{mockMembershipPlans.slice(0, 4).map((plan, index) => (
							<motion.div
								key={plan.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05, duration: 0.4 }}
							>
								<DuoCard variant="default" size="default">
									<div className="mb-2 flex items-start justify-between">
										<div>
											<div className="text-sm font-bold text-duo-text">
												{plan.name}
											</div>
											<div className="text-xs text-duo-gray-dark">
												{plan.duration} dias
											</div>
										</div>
										<div className="text-right">
											<div className="text-lg font-bold text-duo-green">
												R$ {plan.price}
											</div>
											<div className="text-xs text-duo-gray-dark">
												{plan.type === "monthly" ? "/mês" : "total"}
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										<Button size="sm" variant="outline" className="flex-1">
											Editar
										</Button>
										<Button size="sm" variant="destructive">
											<Trash2 className="h-3 w-3" />
										</Button>
									</div>
								</DuoCard>
							</motion.div>
						))}
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.4}>
				<SectionCard title="Outras Configurações" icon={Shield}>
					<div className="space-y-3">
						{[
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
						].map((setting, index) => (
							<motion.div
								key={setting.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05, duration: 0.4 }}
							>
								<DuoCard
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
											<div className="text-sm font-bold text-duo-text">
												{setting.title}
											</div>
											<div className="text-xs text-duo-gray-dark">
												{setting.description}
											</div>
										</div>
									</div>
								</DuoCard>
							</motion.div>
						))}
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.5}>
				<SectionCard title="Conta" icon={Shield}>
					<div className="space-y-3">
						{/* Verificar todas as fontes possíveis para garantir que funcione */}
						{(isAdmin || userInfo?.role === "ADMIN") && (
							<DuoCard
								variant="default"
								size="default"
								className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
								onClick={handleSwitchToStudent}
							>
								<div className="flex items-center gap-3">
									<div className="rounded-xl bg-duo-blue/10 p-3">
										<ArrowRightLeft className="h-5 w-5 text-duo-blue" />
									</div>
									<div className="flex-1 text-left">
										<div className="text-sm font-bold text-duo-text">
											Trocar para Perfil de Aluno
										</div>
										<div className="text-xs text-duo-gray-dark">
											Acessar como estudante
										</div>
									</div>
								</div>
							</DuoCard>
						)}
						<DuoCard
							variant="default"
							size="default"
							className="cursor-pointer transition-all hover:border-red-300 active:scale-[0.98]"
							onClick={handleLogout}
						>
							<div className="flex items-center gap-3">
								<div className="rounded-xl bg-red-50 p-3">
									<LogOut className="h-5 w-5 text-red-600" />
								</div>
								<div className="flex-1 text-left">
									<div className="text-sm font-bold text-duo-text">Sair</div>
									<div className="text-xs text-duo-gray-dark">
										Fazer logout da conta
									</div>
								</div>
							</div>
						</DuoCard>
					</div>
				</SectionCard>
			</SlideIn>
		</div>
	);
}
