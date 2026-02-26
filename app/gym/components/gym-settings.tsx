"use client";

import {
	ArrowRightLeft,
	Bell,
	Building2,
	Clock,
	CreditCard,
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
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import { DuoCardHeader } from "@/components/duo";
import { DuoInput } from "@/components/duo";
import { DuoSelect } from "@/components/duo";
import { Label } from "@/components/ui/label";
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

const DEFAULT_OPEN = "06:00";
const DEFAULT_CLOSE = "22:00";

type DaySchedule = { open: string; close: string; enabled: boolean };

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
	const [address, setAddress] = useState(initialProfile.address ?? "");
	const [phone, setPhone] = useState(initialProfile.phone ?? "");
	const [cnpj, setCnpj] = useState(initialProfile.cnpj ?? "");
	const [pixKeyType, setPixKeyType] = useState<string>(
		initialProfile.pixKeyType ?? "",
	);
	const [pixKey, setPixKey] = useState(initialProfile.pixKey ?? "");

	// Horários por dia (ex: sexta 18h, outros 22h)
	const parseInitialSchedules = (): Record<string, DaySchedule> => {
		const oh = initialProfile.openingHours;
		const days = oh?.days ?? ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
		const defaultOpen = oh?.open ?? DEFAULT_OPEN;
		const defaultClose = oh?.close ?? DEFAULT_CLOSE;
		const byDay = oh?.byDay ?? {};
		const result: Record<string, DaySchedule> = {};
		for (const d of WEEKDAYS) {
			const override = byDay[d.id];
			result[d.id] = {
				open: override?.open ?? defaultOpen,
				close: override?.close ?? defaultClose,
				enabled: days.includes(d.id),
			};
		}
		return result;
	};
	const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>(
		parseInitialSchedules,
	);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState("");

	// Sincroniza quando troca de academia (profile vem de outra gym)
	useEffect(() => {
		setProfile(initialProfile);
		setAddress(initialProfile.address ?? "");
		setPhone(initialProfile.phone ?? "");
		setCnpj(initialProfile.cnpj ?? "");
		setPixKeyType(initialProfile.pixKeyType ?? "");
		setPixKey(initialProfile.pixKey ?? "");
		setDaySchedules(parseInitialSchedules());
	}, [initialProfile?.id]);

	const {
		isAdmin: serverIsAdmin,
		role: serverRole,
		isLoading: _sessionLoading,
	} = useUserSession();

	const isAdmin = serverIsAdmin || serverRole === "ADMIN";

	const updateDaySchedule = (dayId: string, field: keyof DaySchedule, value: string | boolean) => {
		setDaySchedules((prev) => ({
			...prev,
			[dayId]: { ...prev[dayId], [field]: value },
		}));
	};

	const handleSaveProfile = async () => {
		setSaving(true);
		setSaveError("");
		try {
			const { apiClient } = await import("@/lib/api/client");
			const openDays = Object.entries(daySchedules)
				.filter(([, s]) => s.enabled)
				.map(([id]) => id);
			const byDay: Record<string, { open: string; close: string }> = {};
			for (const [id, s] of Object.entries(daySchedules)) {
				if (s.enabled) byDay[id] = { open: s.open, close: s.close };
			}
			const { data } = await apiClient.patch<{ profile: GymProfile }>(
				"/api/gyms/profile",
				{
					address: address.trim() || undefined,
					phone: phone.trim() || undefined,
					cnpj: cnpj.trim() || null,
					pixKey: pixKey.trim() || null,
					pixKeyType: pixKeyType || null,
					openingHours: {
						days: openDays,
						byDay: Object.keys(byDay).length > 0 ? byDay : undefined,
						open: DEFAULT_OPEN,
						close: DEFAULT_CLOSE,
					},
				},
			);
			if (data.profile) setProfile(data.profile);
			router.refresh();
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: { details?: unknown } } }).response?.data
					: null;
			const details = msg && typeof msg === "object" && "details" in msg ? (msg as { details?: unknown }).details : null;
			const errMsg =
				Array.isArray(details) && details.length > 0
					? (details[0] as { message?: string }).message ?? "Erro de validação"
					: err instanceof Error
						? err.message
						: "Erro ao salvar. Tente novamente.";
			setSaveError(errMsg);
		} finally {
			setSaving(false);
		}
	};

	const hasInfoChanges =
		address !== (profile.address ?? "") ||
		phone !== (profile.phone ?? "") ||
		cnpj !== (profile.cnpj ?? "") ||
		pixKey !== (profile.pixKey ?? "") ||
		pixKeyType !== (profile.pixKeyType ?? "");

	const hasScheduleChanges = (() => {
		const oh = profile.openingHours;
		const prevDays = (oh?.days ?? []).sort();
		const currDays = Object.entries(daySchedules)
			.filter(([, s]) => s.enabled)
			.map(([id]) => id)
			.sort();
		if (JSON.stringify(prevDays) !== JSON.stringify(currDays)) return true;
		const prevByDay = oh?.byDay ?? {};
		for (const [id, s] of Object.entries(daySchedules)) {
			if (!s.enabled) continue;
			const prev = prevByDay[id] ?? { open: oh?.open ?? DEFAULT_OPEN, close: oh?.close ?? DEFAULT_CLOSE };
			if (prev.open !== s.open || prev.close !== s.close) return true;
		}
		return false;
	})();

	const hasChanges = hasInfoChanges || hasScheduleChanges;

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
				<DuoCard variant="orange" padding="md">
					<DuoCardHeader>
						<div className="flex items-center gap-2">
							<Building2 className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">{profile.name}</h2>
						</div>
					</DuoCardHeader>
					<p className="mb-4 text-sm font-medium text-duo-text">Plano {profile.plan}</p>
					<div className="space-y-3">
						{[
							{
								icon: MapPin,
								title: "Endereço",
								description: "Opcional",
								color: "duo-green",
								content: (
									<DuoInput
										id="address"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										placeholder="Opcional"
										className="mt-2"
									/>
								),
							},
							{
								icon: Phone,
								title: "Telefone",
								description: "Opcional",
								color: "duo-blue",
								content: (
									<DuoInput
										id="phone"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="Opcional"
										className="mt-2"
									/>
								),
							},
							{
								icon: Mail,
								title: "Email",
								description: "Não pode ser alterado aqui",
								color: "neutral",
								content: (
									<p className="mt-2 text-sm font-medium text-duo-text">
										{profile.email}
									</p>
								),
							},
							{
								icon: FileText,
								title: "CNPJ",
								description: "Opcional",
								color: "duo-purple",
								content: (
									<DuoInput
										id="cnpj"
										value={cnpj}
										onChange={(e) => setCnpj(e.target.value)}
										placeholder="Opcional"
										className="mt-2"
									/>
								),
							},
							{
								icon: CreditCard,
								title: "Chave PIX para Recebimentos",
								description: "Os pagamentos dos alunos serão transferidos para esta chave",
								color: "duo-yellow",
								content: (
									<div className="mt-2 flex flex-col gap-2 sm:flex-row">
										<DuoSelect
											options={[
												{ value: "", label: "Tipo de chave" },
												{ value: "CPF", label: "CPF" },
												{ value: "CNPJ", label: "CNPJ" },
												{ value: "PHONE", label: "Telefone" },
												{ value: "EMAIL", label: "E-mail" },
												{ value: "RANDOM", label: "Chave aleatória" },
											]}
											value={pixKeyType}
											onChange={setPixKeyType}
											placeholder="Tipo de chave"
											className="min-w-[180px] sm:min-w-0 sm:flex-1"
										/>
										<DuoInput
											value={pixKey}
											onChange={(e) => setPixKey(e.target.value)}
											placeholder={
												pixKeyType === "CPF"
													? "000.000.000-00"
													: pixKeyType === "CNPJ"
														? "00.000.000/0001-00"
														: pixKeyType === "PHONE"
															? "(00) 00000-0000"
															: pixKeyType === "EMAIL"
																? "email@exemplo.com"
																: pixKeyType === "RANDOM"
																	? "Chave aleatória (e-mail)"
																	: "Selecione o tipo primeiro"
											}
											className="flex-1"
										/>
									</div>
								),
							},
						].map((field, index) => (
							<motion.div
								key={field.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05, duration: 0.4 }}
							>
								<DuoCard variant="default" size="default">
									<div className="flex flex-col gap-3">
										<div className="flex items-center gap-3">
											<div
												className={cn(
													"shrink-0 rounded-xl p-3",
													field.color === "duo-green" && "bg-duo-green/10",
													field.color === "duo-blue" && "bg-duo-blue/10",
													field.color === "neutral" && "bg-gray-100",
													field.color === "duo-purple" && "bg-duo-purple/10",
													field.color === "duo-yellow" && "bg-duo-yellow/10",
												)}
											>
												{field.color === "duo-green" && (
													<MapPin className="h-5 w-5 text-duo-green" />
												)}
												{field.color === "duo-blue" && (
													<Phone className="h-5 w-5 text-duo-blue" />
												)}
												{field.color === "neutral" && (
													<Mail className="h-5 w-5 text-duo-gray-dark" />
												)}
												{field.color === "duo-purple" && (
													<FileText className="h-5 w-5 text-duo-purple" />
												)}
												{field.color === "duo-yellow" && (
													<CreditCard className="h-5 w-5 text-duo-yellow" />
												)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="text-sm font-bold text-duo-text">
													{field.title}
												</div>
												<div className="text-xs text-duo-gray-dark">
													{field.description}
												</div>
											</div>
										</div>
										<div>{field.content}</div>
									</div>
								</DuoCard>
							</motion.div>
						))}
						{hasChanges && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.25, duration: 0.4 }}
							>
								<DuoButton
									onClick={handleSaveProfile}
									disabled={saving}
									className="w-full"
								>
									{saving ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"Salvar alterações"
									)}
								</DuoButton>
							</motion.div>
						)}
						{saveError && (
							<p className="text-sm font-medium text-red-600">{saveError}</p>
						)}
					</div>
				</DuoCard>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoCard variant="blue" padding="md">
					<DuoCardHeader>
						<div className="flex items-center gap-2">
							<Clock className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">Horários e Dias de Funcionamento</h2>
						</div>
					</DuoCardHeader>
					<p className="mb-4 text-sm font-medium text-duo-text">
						Configura horários diferentes por dia (ex: sexta fecha 18h, outros 22h)
					</p>
					<div className="space-y-3">
						{WEEKDAYS.map((day, index) => {
							const s = daySchedules[day.id];
							if (!s) return null;
							return (
								<motion.div
									key={day.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.4 }}
								>
									<DuoCard
										variant="default"
										size="default"
										className={cn(
											"transition-colors",
											s.enabled && "border-duo-blue/30 bg-duo-blue/5",
										)}
									>
										<div className="flex flex-col gap-3">
											<div className="flex items-center gap-3">
												<div className="shrink-0 rounded-xl bg-duo-blue/10 p-3">
													<Clock className="h-5 w-5 text-duo-blue" />
												</div>
												<label className="flex cursor-pointer items-center gap-2">
													<input
														type="checkbox"
														checked={s.enabled}
														onChange={(e) =>
															updateDaySchedule(day.id, "enabled", e.target.checked)
														}
														className="h-4 w-4 rounded"
													/>
													<span className="text-sm font-bold text-duo-text">
														{day.label}
													</span>
												</label>
											</div>
											{s.enabled && (
												<div className="flex flex-wrap items-center gap-3 sm:gap-4">
													<div className="flex items-center gap-2">
														<Label className="shrink-0 text-xs font-medium text-duo-gray-dark">
															Abre
														</Label>
														<DuoInput
															type="time"
															value={s.open}
															onChange={(e) =>
																updateDaySchedule(day.id, "open", e.target.value)
															}
															className="h-9 w-auto min-w-0"
														/>
													</div>
													<div className="flex items-center gap-2">
														<Label className="shrink-0 text-xs font-medium text-duo-gray-dark">
															Fecha
														</Label>
														<DuoInput
															type="time"
															value={s.close}
															onChange={(e) =>
																updateDaySchedule(day.id, "close", e.target.value)
															}
															className="h-9 w-auto min-w-0"
														/>
													</div>
												</div>
											)}
										</div>
									</DuoCard>
								</motion.div>
							);
						})}
					</div>
					{hasChanges && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.35, duration: 0.4 }}
							className="mt-4"
						>
							<DuoButton
								onClick={handleSaveProfile}
								disabled={saving}
								className="w-full"
							>
								{saving ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Salvar horários"
								)}
							</DuoButton>
						</motion.div>
					)}
				</DuoCard>
			</SlideIn>

			<SlideIn delay={0.3}>
				<MembershipPlansPage plans={plans} />
			</SlideIn>

			<SlideIn delay={0.4}>
				<DuoCard variant="default" padding="md">
					<DuoCardHeader>
						<div className="flex items-center gap-2">
							<Shield className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">Outras Configurações</h2>
						</div>
					</DuoCardHeader>
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
				</DuoCard>
			</SlideIn>

			<SlideIn delay={0.5}>
				<DuoCard variant="default" padding="md">
					<DuoCardHeader>
						<div className="flex items-center gap-2">
							<Shield className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-[var(--duo-fg)]">Conta</h2>
						</div>
					</DuoCardHeader>
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
				</DuoCard>
			</SlideIn>
		</div>
	);
}
