"use client";

import {
	ArrowRightLeft,
	Bell,
	Building2,
	Clock,
	FileText,
	Loader2,
	LogOut,
	Mail,
	MapPin,
	Phone,
	Shield,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { Button } from "@/components/ui/button";
import { DuoCard } from "@/components/ui/duo-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { useUserSession } from "@/hooks/use-user-session";
import type { GymProfile, MembershipPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MembershipPlansPage } from "./membership-plans-page";

const WEEKDAYS = [
	{ id: "monday", label: "Segunda" },
	{ id: "tuesday", label: "Terça" },
	{ id: "wednesday", label: "Quarta" },
	{ id: "thursday", label: "Quinta" },
	{ id: "friday", label: "Sexta" },
	{ id: "saturday", label: "Sábado" },
	{ id: "sunday", label: "Domingo" },
] as const;

interface GymSettingsPageProps {
	profile: GymProfile;
	plans: MembershipPlan[];
	userInfo?: { isAdmin: boolean; role: string | null };
}

export function GymSettingsPage({
	profile: initialProfile,
	plans,
	userInfo = { isAdmin: false, role: null },
}: GymSettingsPageProps) {
	const router = useRouter();
	const [profile, setProfile] = useState(initialProfile);
	const [address, setAddress] = useState(initialProfile.address);
	const [phone, setPhone] = useState(initialProfile.phone);
	const [cnpj, setCnpj] = useState(initialProfile.cnpj ?? "");
	const [openTime, setOpenTime] = useState(
		initialProfile.openingHours?.open ?? "06:00",
	);
	const [closeTime, setCloseTime] = useState(
		initialProfile.openingHours?.close ?? "22:00",
	);
	const [openDays, setOpenDays] = useState<string[]>(
		initialProfile.openingHours?.days ?? [
			"monday",
			"tuesday",
			"wednesday",
			"thursday",
			"friday",
			"saturday",
		],
	);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState("");

	const {
		isAdmin: serverIsAdmin,
		role: serverRole,
		isLoading: _sessionLoading,
	} = useUserSession();

	const isAdmin = serverIsAdmin || serverRole === "ADMIN";

	const toggleDay = (day: string) => {
		setOpenDays((prev) =>
			prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
		);
	};

	const handleSaveProfile = async () => {
		setSaving(true);
		setSaveError("");
		try {
			const { apiClient } = await import("@/lib/api/client");
			const { data } = await apiClient.patch<{ profile: GymProfile }>(
				"/api/gyms/profile",
				{
					address,
					phone,
					cnpj: cnpj.trim() || null,
					openingHours: {
						open: openTime,
						close: closeTime,
						days: openDays,
					},
				},
			);
			if (data.profile) setProfile(data.profile);
			router.refresh();
		} catch (err) {
			setSaveError(
				err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.",
			);
		} finally {
			setSaving(false);
		}
	};

	const hasChanges =
		address !== profile.address ||
		phone !== profile.phone ||
		cnpj !== (profile.cnpj ?? "") ||
		openTime !== (profile.openingHours?.open ?? "06:00") ||
		closeTime !== (profile.openingHours?.close ?? "22:00") ||
		JSON.stringify(openDays.sort()) !==
			JSON.stringify((profile.openingHours?.days ?? []).sort());

	const handleLogout = async () => {
		try {
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
		<div className="mx-auto max-w-4xl space-y-6">
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
					<div className="mb-4">
						<p className="text-sm text-duo-gray-dark">Plano {profile.plan}</p>
					</div>
					<div className="space-y-3">
						<div>
							<Label htmlFor="address" className="flex items-center gap-2 text-xs font-bold text-duo-gray-dark">
								<MapPin className="h-4 w-4" />
								Endereço
							</Label>
							<Input
								id="address"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								className="mt-1"
							/>
						</div>
						<div>
							<Label htmlFor="phone" className="flex items-center gap-2 text-xs font-bold text-duo-gray-dark">
								<Phone className="h-4 w-4" />
								Telefone
							</Label>
							<Input
								id="phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								className="mt-1"
							/>
						</div>
						<div>
							<Label className="flex items-center gap-2 text-xs font-bold text-duo-gray-dark">
								<Mail className="h-4 w-4" />
								Email
							</Label>
							<p className="mt-1 text-sm font-bold text-duo-text">
								{profile.email}
							</p>
							<p className="text-xs text-duo-gray-dark">
								Email não pode ser alterado aqui
							</p>
						</div>
						<div>
							<Label htmlFor="cnpj" className="flex items-center gap-2 text-xs font-bold text-duo-gray-dark">
								<FileText className="h-4 w-4" />
								CNPJ
							</Label>
							<Input
								id="cnpj"
								value={cnpj}
								onChange={(e) => setCnpj(e.target.value)}
								placeholder="Opcional"
								className="mt-1"
							/>
						</div>
						{hasChanges && (
							<Button
								onClick={handleSaveProfile}
								disabled={saving}
								className="w-full"
							>
								{saving ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Salvar alterações"
								)}
							</Button>
						)}
						{saveError && (
							<p className="text-sm text-red-600">{saveError}</p>
						)}
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.2}>
				<SectionCard
					title="Horários e Dias de Funcionamento"
					icon={Clock}
					variant="blue"
				>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="openTime">Abertura</Label>
								<Input
									id="openTime"
									type="time"
									value={openTime}
									onChange={(e) => setOpenTime(e.target.value)}
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="closeTime">Fechamento</Label>
								<Input
									id="closeTime"
									type="time"
									value={closeTime}
									onChange={(e) => setCloseTime(e.target.value)}
									className="mt-1"
								/>
							</div>
						</div>
						<div>
							<Label className="mb-2 block">Dias de funcionamento</Label>
							<div className="flex flex-wrap gap-2">
								{WEEKDAYS.map((day) => (
									<button
										key={day.id}
										type="button"
										onClick={() => toggleDay(day.id)}
										className={cn(
											"rounded-lg px-3 py-2 text-sm font-bold transition-colors",
											openDays.includes(day.id)
												? "bg-duo-blue text-white"
												: "bg-gray-100 text-duo-gray-dark hover:bg-gray-200",
										)}
									>
										{day.label}
									</button>
								))}
							</div>
						</div>
						{hasChanges && (
							<Button
								onClick={handleSaveProfile}
								disabled={saving}
								className="w-full"
							>
								{saving ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Salvar horários"
								)}
							</Button>
						)}
					</div>
				</SectionCard>
			</SlideIn>

			<SlideIn delay={0.3}>
				<MembershipPlansPage plans={plans} />
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
