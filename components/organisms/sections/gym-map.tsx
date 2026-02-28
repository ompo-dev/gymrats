"use client";

import {
	Check,
	ChevronRight,
	Clock,
	CreditCard,
	MapPin,
	Navigation,
	Phone,
	Star,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton } from "@/components/duo";
import { DuoCard } from "@/components/duo";
import { DuoSelect } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import type { DayPass, GymLocation, StudentGymMembership } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GymMapProps {
	gyms: GymLocation[];
	dayPasses: DayPass[];
	memberships?: StudentGymMembership[];
	onPurchaseDayPass: (gymId: string) => void;
	onJoinPlan?: (gymId: string, planId: string) => void;
	onChangePlan?: (membershipId: string, planId: string) => void;
	onViewGymProfile?: (gymId: string) => void;
}

function GymMapSimple({
	gyms,
	dayPasses,
	memberships = [],
	onPurchaseDayPass,
	onJoinPlan,
	onChangePlan,
	onViewGymProfile,
}: GymMapProps) {
	const [selectedGym, setSelectedGym] = useState<GymLocation | null>(null);
	const [filter, setFilter] = useState<"all" | "open" | "near" | "subscribed">("all");
	const [expandedPlanKey, setExpandedPlanKey] = useState<string | null>(null);
	const [_userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const { loadGymLocationsWithPosition } = useStudent("loaders");

	useEffect(() => {
		if (!selectedGym) setExpandedPlanKey(null);
	}, [selectedGym]);

	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setUserLocation({ lat: latitude, lng: longitude });
					loadGymLocationsWithPosition(latitude, longitude);
				},
				() => {
					setUserLocation({ lat: -23.5505, lng: -46.6333 });
				},
			);
		}
	}, [loadGymLocationsWithPosition]);

	const filteredGyms = gyms.filter((gym) => {
		if (filter === "open") return gym.openNow;
		if (filter === "near") return (gym.distance ?? 0) < 3;
		if (filter === "subscribed")
			return memberships.some(
				(m) => m.gymId === gym.id && m.status !== "canceled",
			);
		return true;
	});

	const sortedGyms = [...filteredGyms].sort(
		(a, b) => (a.distance || 0) - (b.distance || 0),
	);

	const filterOptions = [
		{ value: "all", label: "Todas" },
		{ value: "subscribed", label: "Onde estou inscrito" },
		{ value: "near", label: "Próximas" },
		{ value: "open", label: "Abertas" },
	];

	const planTypeLabel: Record<string, string> = {
		daily: "Diária",
		weekly: "Semanal",
		monthly: "Mensal",
		quarterly: "Trimestral",
		"semi-annual": "Semestral",
		annual: "Anual",
		trial: "Trial",
	};

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<FadeIn>
				<div className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-duo-text">
						Academias Parceiras
					</h1>
					<p className="text-sm text-duo-gray-dark">
						Encontre academias próximas e compre diárias
					</p>
				</div>
			</FadeIn>

			<SlideIn delay={0.1}>
				<DuoCard.Root variant="default" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<MapPin className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-duo-fg">Filtros</h2>
						</div>
					</DuoCard.Header>
					<DuoSelect.Simple
						options={filterOptions}
						value={filter}
						onChange={(value) =>
							setFilter(value as "all" | "open" | "near" | "subscribed")
						}
						placeholder="Filtro"
					/>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.2}>
				<DuoCard.Root variant="default" size="default" className="relative h-48">
					<div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-100 to-green-100 rounded-2xl">
						<MapPin className="h-16 w-16 text-duo-blue" />
					</div>
					<div className="absolute bottom-2 left-2 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1">
						<Navigation className="h-3 w-3" />
						{sortedGyms.length} academias próximas
					</div>
				</DuoCard.Root>
			</SlideIn>

			<SlideIn delay={0.3}>
				<DuoCard.Root variant="default" padding="md">
					<DuoCard.Header>
						<div className="flex items-center gap-2">
							<MapPin className="h-5 w-5 shrink-0" style={{ color: "var(--duo-secondary)" }} aria-hidden />
							<h2 className="font-bold text-duo-fg">Academias Cadastradas</h2>
						</div>
					</DuoCard.Header>
					<div className="space-y-3">
						{sortedGyms.map((gym, index) => {
							const hasActivePass = dayPasses.some(
								(pass) => pass.gymId === gym.id && pass.status === "active",
							);

							return (
								<motion.div
									key={gym.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05, duration: 0.4 }}
								>
									<DuoCard.Root
										variant="default"
										size="default"
										onClick={() =>
											setSelectedGym(selectedGym?.id === gym.id ? null : gym)
										}
										className="cursor-pointer transition-all hover:border-duo-blue active:scale-[0.98]"
									>
										<div className="flex items-start gap-3">
											<div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
												<img
													src={
														gym.logo ||
														(gym.photos && gym.photos[0]) ||
														"/placeholder.svg"
													}
													alt={gym.name}
													className="h-full w-full object-cover"
												/>
											</div>

											<div className="flex-1">
												<div className="flex items-center gap-2">
													<h3 className="font-bold text-duo-text">
														{gym.name}
													</h3>
													{gym.openNow && (
														<span className="rounded-full bg-duo-green px-2 py-0.5 text-[10px] font-bold text-white">
															ABERTA
														</span>
													)}
												</div>

												<div className="mt-1 flex items-center gap-3 text-xs text-duo-gray-dark">
													<div className="flex items-center gap-1">
														<Star className="h-3 w-3 fill-duo-yellow text-duo-yellow" />
														<span className="font-bold">{gym.rating}</span>
														<span>({gym.totalReviews})</span>
													</div>
													<div className="flex items-center gap-1">
														<MapPin className="h-3 w-3" />
														<span className="font-bold">
															{gym.distance?.toFixed(1)} km
														</span>
													</div>
												</div>

												<p className="mt-1 text-xs text-duo-gray-dark">
													{gym.address}
												</p>
											</div>

											<ChevronRight
												className={cn(
													"h-5 w-5 shrink-0 text-duo-gray-dark transition-transform",
													selectedGym?.id === gym.id && "rotate-90",
												)}
											/>
										</div>

										{selectedGym?.id === gym.id && (
											<div className="mt-4 space-y-4 border-t-2 border-duo-border pt-4">
												{gym.openingHours && (
													<div className="flex items-center gap-2 text-sm">
														<Clock className="h-4 w-4 text-duo-blue" />
														<span className="font-bold text-duo-gray-dark">
															{gym.openingHours.open === "24h"
																? "Aberto 24 horas"
																: `${gym.openingHours.open} - ${gym.openingHours.close}`}
														</span>
													</div>
												)}

												{gym.amenities && gym.amenities.length > 0 && (
													<div>
														<p className="mb-2 text-xs font-bold text-duo-gray-dark">
															Comodidades:
														</p>
														<div className="flex flex-wrap gap-2">
															{gym.amenities.map((amenity) => (
																<span
																	key={amenity}
																	className="rounded-full border-2 border-duo-border bg-duo-blue/10 px-2 py-1 text-xs font-bold text-duo-blue"
																>
																	<Check className="mr-1 inline h-3 w-3" />
																	{amenity}
																</span>
															))}
														</div>
													</div>
												)}

												<div>
													<p className="mb-2 text-xs font-bold text-duo-gray-dark">
														Planos disponíveis
													</p>
													{gym.membershipPlans && gym.membershipPlans.length > 0 ? (
														<div className="space-y-2">
															{gym.membershipPlans.map((plan) => {
																const myMembership = memberships.find(
																	(m) => m.gymId === gym.id && m.status !== "canceled",
																);
																const isMyPlan = myMembership?.planId === plan.id;
																const isActive = myMembership?.status === "active";
																const isPending = myMembership?.status === "pending";
																const canContract = !myMembership;
																const canChangePlan =
																	myMembership &&
																	isActive &&
																	!isMyPlan &&
																	!!onChangePlan;
																const planKey = `${gym.id}-${plan.id}`;
																const isExpanded = expandedPlanKey === planKey;
																const isInteractive = canContract || canChangePlan;

																return (
																	<DuoCard.Root
																		key={plan.id}
																		variant="default"
																		size="sm"
																		className={cn(
																			isInteractive &&
																				"cursor-pointer transition-all hover:border-duo-blue",
																			isExpanded && "ring-2 ring-duo-blue",
																		)}
																		onClick={(e) => {
																			e.stopPropagation();
																			if (!isInteractive) return;
																			if (isExpanded) {
																				if (canContract) onJoinPlan?.(gym.id, plan.id);
																				if (canChangePlan)
																					onChangePlan?.(myMembership!.id, plan.id);
																			} else {
																				setExpandedPlanKey(planKey);
																			}
																		}}
																	>
																		<div className="flex w-full min-w-0 flex-col gap-2">
																			<div className="flex min-w-0 items-start justify-between gap-3">
																				<div className="flex flex-col gap-0.5 min-w-0 flex-1">
																					<p className="text-xs font-bold text-duo-fg truncate">
																						{plan.name}
																					</p>
																					<div className="flex flex-wrap items-center gap-1.5 text-[10px] text-duo-fg-muted">
																						<span>{plan.duration} dias</span>
																						<span>•</span>
																						<span>{planTypeLabel[plan.type] || plan.type}</span>
																						{isMyPlan && isActive && (
																							<>
																								<span>•</span>
																								<span className="font-bold text-duo-primary">Plano ativo</span>
																							</>
																						)}
																						{isMyPlan && isPending && (
																							<>
																								<span>•</span>
																								<span className="font-bold text-duo-warning">Matrícula pendente</span>
																							</>
																						)}
																						{canContract && !isExpanded && (
																							<>
																								<span>•</span>
																								<span>Clique para assinar</span>
																							</>
																						)}
																						{canChangePlan && !isExpanded && (
																							<>
																								<span>•</span>
																								<span className="font-bold text-duo-secondary">Clique para trocar</span>
																							</>
																						)}
																					</div>
																				</div>
																				<p className="text-sm font-bold text-duo-primary shrink-0">
																					R$ {plan.price.toFixed(2)}
																				</p>
																			</div>
																			{isExpanded && isInteractive && (
																				<div className="flex gap-2 pt-1 border-t border-duo-border">
																					<DuoButton
																						variant="outline"
																						size="sm"
																						onClick={(e) => {
																							e.stopPropagation();
																							setExpandedPlanKey(null);
																						}}
																					>
																						Fechar
																					</DuoButton>
																					{canContract && (
																						<DuoButton
																							variant="primary"
																							size="sm"
																							onClick={(e) => {
																								e.stopPropagation();
																								onJoinPlan?.(gym.id, plan.id);
																								setExpandedPlanKey(null);
																							}}
																							className="flex items-center gap-2"
																						>
																							<CreditCard className="h-4 w-4" />
																							Assinar este plano
																						</DuoButton>
																					)}
																					{canChangePlan && (
																						<DuoButton
																							variant="primary"
																							size="sm"
																							onClick={(e) => {
																								e.stopPropagation();
																								onChangePlan?.(myMembership!.id, plan.id);
																								setExpandedPlanKey(null);
																							}}
																							className="flex items-center gap-2"
																						>
																							<CreditCard className="h-4 w-4" />
																							Trocar para este plano
																						</DuoButton>
																					)}
																				</div>
																			)}
																		</div>
																	</DuoCard.Root>
																);
															})}
														</div>
													) : (
														<div className="grid grid-cols-3 gap-2">
															{gym.plans?.daily != null && gym.plans.daily > 0 && (
																<DuoCard.Root
																	variant="yellow"
																	size="sm"
																	className="p-2 flex items-center justify-between gap-2"
																>
																	<p className="text-[10px] font-bold text-duo-fg-muted">
																		Diária
																	</p>
																	<p className="text-sm font-bold text-duo-warning">
																		R$ {gym.plans.daily}
																	</p>
																</DuoCard.Root>
															)}
															{gym.plans?.weekly != null && gym.plans.weekly > 0 && (
																<DuoCard.Root
																	variant="orange"
																	size="sm"
																	className="p-2 flex items-center justify-between gap-2"
																>
																	<p className="text-[10px] font-bold text-duo-fg-muted">
																		Semanal
																	</p>
																	<p className="text-sm font-bold text-duo-accent">
																		R$ {gym.plans.weekly}
																	</p>
																</DuoCard.Root>
															)}
															{gym.plans?.monthly != null && gym.plans.monthly > 0 && (
																<DuoCard.Root
																	variant="highlighted"
																	size="sm"
																	className="p-2 flex items-center justify-between gap-2"
																>
																	<p className="text-[10px] font-bold text-duo-fg-muted">
																		Mensal
																	</p>
																	<p className="text-sm font-bold text-duo-primary">
																		R$ {gym.plans.monthly}
																	</p>
																</DuoCard.Root>
															)}
														</div>
													)}
												</div>

												<div className="grid grid-cols-2 gap-2">
													{onViewGymProfile && (
														<DuoButton
															variant="outline"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																onViewGymProfile(gym.id);
															}}
															className="flex items-center justify-center gap-2"
														>
															<MapPin className="h-4 w-4" />
															Ver perfil
														</DuoButton>
													)}
													<DuoButton
														variant="outline"
														size="sm"
														disabled={!gym.phone}
														onClick={(e) => {
															e.stopPropagation();
															if (gym.phone) window.open(`tel:${gym.phone}`, "_self");
														}}
														className="flex items-center justify-center gap-2"
													>
														<Phone className="h-4 w-4" />
														Ligar
													</DuoButton>

													{hasActivePass ? (
														<DuoButton
															variant="primary"
															size="sm"
															disabled
															className="col-span-2 flex items-center justify-center gap-2"
														>
															<Check className="h-4 w-4" />
															Passe Ativo
														</DuoButton>
													) : gym.membershipPlans && gym.membershipPlans.length > 0 ? (
														<DuoButton
															variant="primary"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																onJoinPlan?.(gym.id, gym.membershipPlans![0].id);
															}}
															className="col-span-2 flex items-center justify-center gap-2"
														>
															<CreditCard className="h-4 w-4" />
															Assinar plano
														</DuoButton>
													) : (
														<DuoButton
															variant="primary"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																onPurchaseDayPass(gym.id);
															}}
															disabled={!(gym.plans?.daily && gym.plans.daily > 0)}
															className="col-span-2 flex items-center justify-center gap-2"
														>
															<CreditCard className="h-4 w-4" />
															Diária
														</DuoButton>
													)}
												</div>
											</div>
										)}
									</DuoCard.Root>
								</motion.div>
							);
						})}
					</div>
				</DuoCard.Root>
			</SlideIn>
		</div>
	);
}

export const GymMap = {
	Simple: GymMapSimple,
};
