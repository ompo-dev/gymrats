"use client";

import {
	ArrowLeft,
	Check,
	Clock,
	CreditCard,
	Dumbbell,
	MapPin,
	Phone,
	Star,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import { SectionCard } from "@/components/molecules/cards/section-card";
import { FadeIn } from "@/components/animations/fade-in";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface GymProfileData {
	id: string;
	name: string;
	address: string;
	phone?: string;
	email?: string;
	logo?: string;
	rating: number;
	totalReviews: number;
	openingHours?: { open?: string; close?: string };
	amenities: string[];
	equipmentCount: number;
	totalStudents: number;
	activeStudents: number;
	equipment: Array<{ id: string; name: string; type: string; status: string }>;
	plans: Array<{
		id: string;
		name: string;
		type: string;
		price: number;
		duration: number;
		benefits?: string[];
	}>;
}

interface GymProfileViewProps {
	gymId: string;
	onBack: () => void;
	onJoinPlan: (gymId: string, planId: string) => void;
}

export function GymProfileView({
	gymId,
	onBack,
	onJoinPlan,
}: GymProfileViewProps) {
	const [profile, setProfile] = useState<GymProfileData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		apiClient
			.get<GymProfileData>(`/api/students/gyms/${gymId}/profile`)
			.then((res) => {
				if (!cancelled) {
					setProfile(res.data);
					setError(null);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(err?.response?.data?.error || "Erro ao carregar perfil");
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [gymId]);

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl space-y-6">
				<Button variant="ghost" onClick={onBack} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					Voltar
				</Button>
				<div className="py-12 text-center text-duo-gray-dark">
					Carregando perfil da academia...
				</div>
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="mx-auto max-w-4xl space-y-6">
				<Button variant="ghost" onClick={onBack} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					Voltar
				</Button>
				<div className="py-12 text-center text-duo-red">
					{error || "Academia não encontrada"}
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<Button variant="ghost" onClick={onBack} className="gap-2 font-bold">
				<ArrowLeft className="h-4 w-4" />
				Voltar
			</Button>

			<FadeIn>
				<SectionCard title={profile.name} icon={Dumbbell}>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
						{profile.logo && (
							<div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border">
								<img
									src={profile.logo}
									alt={profile.name}
									className="h-full w-full object-cover"
								/>
							</div>
						)}
						<div className="flex-1 space-y-2">
							<div className="flex items-center gap-2">
								<Star className="h-4 w-4 fill-duo-yellow text-duo-yellow" />
								<span className="font-bold">{profile.rating}</span>
								<span className="text-sm text-duo-gray-dark">
									({profile.totalReviews} avaliações)
								</span>
							</div>
							{profile.address && (
								<div className="flex items-center gap-2 text-sm text-duo-gray-dark">
									<MapPin className="h-4 w-4 shrink-0" />
									{profile.address}
								</div>
							)}
							{profile.phone && (
								<div className="flex items-center gap-2 text-sm text-duo-gray-dark">
									<Phone className="h-4 w-4 shrink-0" />
									{profile.phone}
								</div>
							)}
							{profile.openingHours && (
								<div className="flex items-center gap-2 text-sm text-duo-gray-dark">
									<Clock className="h-4 w-4 shrink-0" />
									{profile.openingHours.open === "24h"
										? "Aberto 24 horas"
										: `${profile.openingHours.open} - ${profile.openingHours.close}`}
								</div>
							)}
						</div>
					</div>
				</SectionCard>
			</FadeIn>

			<div className="grid gap-4 sm:grid-cols-2">
				<DuoCard variant="default" size="sm">
					<div className="flex items-center gap-3">
						<Users className="h-6 w-6 text-duo-blue" />
						<div>
							<p className="text-xs text-duo-gray-dark">Alunos ativos</p>
							<p className="text-lg font-bold">{profile.activeStudents}</p>
						</div>
					</div>
				</DuoCard>
				<DuoCard variant="default" size="sm">
					<div className="flex items-center gap-3">
						<Dumbbell className="h-6 w-6 text-duo-orange" />
						<div>
							<p className="text-xs text-duo-gray-dark">Equipamentos</p>
							<p className="text-lg font-bold">{profile.equipmentCount}</p>
						</div>
					</div>
				</DuoCard>
			</div>

			{profile.amenities && profile.amenities.length > 0 && (
				<SectionCard title="Comodidades" icon={Check}>
					<div className="flex flex-wrap gap-2">
						{profile.amenities.map((a) => (
							<span
								key={a}
								className="rounded-full border-2 border-duo-border bg-duo-blue/10 px-3 py-1 text-xs font-bold text-duo-blue"
							>
								{a}
							</span>
						))}
					</div>
				</SectionCard>
			)}

			{profile.equipment && profile.equipment.length > 0 && (
				<SectionCard title="Equipamentos" icon={Dumbbell}>
					<div className="flex flex-wrap gap-2">
						{profile.equipment.slice(0, 12).map((e) => (
							<span
								key={e.id}
								className={cn(
									"rounded-lg border-2 px-2 py-1 text-xs font-bold",
									e.status === "available"
										? "border-duo-green bg-duo-green/10 text-duo-green"
										: "border-duo-border bg-gray-50 text-duo-gray-dark",
								)}
							>
								{e.name}
							</span>
						))}
						{profile.equipment.length > 12 && (
							<span className="rounded-lg border-2 border-duo-border px-2 py-1 text-xs font-bold text-duo-gray-dark">
								+{profile.equipment.length - 12} mais
							</span>
						)}
					</div>
				</SectionCard>
			)}

			<SectionCard title="Planos disponíveis" icon={CreditCard}>
				<div className="space-y-3">
					{profile.plans.length === 0 ? (
						<p className="py-4 text-center text-sm text-duo-gray-dark">
							Nenhum plano disponível no momento
						</p>
					) : (
						profile.plans.map((plan) => (
							<DuoCard
								key={plan.id}
								variant="default"
								size="default"
								className="cursor-pointer transition-all hover:border-duo-blue"
								onClick={() => onJoinPlan(profile.id, plan.id)}
							>
								<div className="flex items-center justify-between">
									<div>
										<p className="font-bold text-duo-text">{plan.name}</p>
										<p className="text-xs text-duo-gray-dark">
											{plan.duration} dias • Tipo: {plan.type}
										</p>
									</div>
									<div className="text-right">
										<p className="text-lg font-bold text-duo-green">
											R$ {plan.price.toFixed(2)}
										</p>
										<Button size="sm" variant="default" className="mt-2">
											Contratar
										</Button>
									</div>
								</div>
							</DuoCard>
						))
					)}
				</div>
			</SectionCard>
		</div>
	);
}
