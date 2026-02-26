"use client";

import {
	AlertCircle,
	Building2,
	CheckCircle,
	CreditCard,
	DollarSign,
	Plus,
	RefreshCw,
	Trash2,
	Wallet,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState, useRef, useMemo } from "react";
import { createAbacateBilling } from "@/lib/actions/abacate-pay";
import { Button } from "@/components/atoms/buttons/button";
import { DuoCard } from "@/components/molecules/cards/duo-card";
import {
	DuoSectionCard,
	DuoStatCard,
	DuoStatsGrid,
} from "@/components/duo";
// Removido useQuery - agora usando store unificado via useStudent() com axios
import { OptionSelector } from "@/components/molecules/selectors/option-selector";
import { SubscriptionCancelDialog } from "@/components/organisms/modals/subscription-cancel-dialog";
import { StudentMembershipPixModal } from "@/app/student/components/student-membership-pix-modal";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import { useLoadPrioritized } from "@/hooks/use-load-prioritized";
import { useModalState } from "@/hooks/use-modal-state";
import { useStudent } from "@/hooks/use-student";
import {
	type SubscriptionData,
	useSubscription,
} from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";
import type {
	PaymentMethod,
	StudentGymMembership,
	StudentPayment,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// Constante fora do componente para garantir que seja sempre o mesmo entre servidor e cliente
const TAB_OPTIONS = [
	{ value: "memberships", label: "Academias", emoji: "🏢" },
	{ value: "payments", label: "Histórico", emoji: "📅" },
	{ value: "subscription", label: "Assinatura", emoji: "👑" },
];

interface StudentPaymentsPageProps {
	subscription?: {
		id: string;
		plan: string;
		status: string;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		cancelAtPeriodEnd: boolean;
		canceledAt: Date | null;
		trialStart: Date | null;
		trialEnd: Date | null;
		isTrial: boolean;
		daysRemaining: number | null;
	} | null;
	startTrial?: () => Promise<{ error?: string; success?: boolean }>;
}

export function StudentPaymentsPage({
	subscription: initialSubscription,
	startTrial: _startTrial,
}: StudentPaymentsPageProps = {}) {
	// Carregamento prioritizado: subscription, payments, paymentMethods, memberships aparecem primeiro
	// Se dados já existem no store, só carrega o que falta
	useLoadPrioritized({ context: "payments" });

	const { toast } = useToast();
	const [subTab, setSubTab] = useQueryState(
		"subTab",
		parseAsString.withDefault("memberships"),
	);
	const [, setTab] = useQueryState("tab", parseAsString.withDefault("home"));

	// Usar hook unificado
	const {
		subscription: storeSubscription,
		memberships: storeMemberships,
		payments: storePayments,
		paymentMethods: storePaymentMethods,
	} = useStudent("subscription", "memberships", "payments", "paymentMethods");

	const {
		subscription: subscriptionData,
		isLoading: isLoadingSubscription,
		startTrial: startTrialHook,
		isStartingTrial,
		createSubscription: _createSubscription,
		isCreatingSubscription,
		cancelSubscription,
		isCancelingSubscription,
		refetch: refetchSubscription,
	} = useSubscription({
		includeDaysRemaining: true,
		includeTrialInfo: true,
		enabled: false, // Desabilitar fetch redundante, usar store unificado
	});
	const cancelDialogModal = useModalState("cancel-subscription");

	const [activeTab, setActiveTab] = useState<
		"memberships" | "payments" | "subscription"
	>("memberships");

	useEffect(() => {
		if (subTab && ["memberships", "payments", "subscription"].includes(subTab)) {
			setActiveTab(subTab as "memberships" | "payments" | "subscription");
		}
	}, [subTab]);

	// Usar subscription do store unificado com fallback
	const hasOptimisticUpdate = storeSubscription?.id === "temp-trial-id";

	const subscription: SubscriptionData | null = hasOptimisticUpdate
		? storeSubscription
		: storeSubscription !== null && storeSubscription !== undefined
			? storeSubscription
			: subscriptionData !== undefined && subscriptionData !== null
				? subscriptionData
				: subscriptionData === null && initialSubscription
					? initialSubscription
					: subscriptionData === null
						? null
						: initialSubscription || null;

	// Atualizar daysRemaining quando subscription mudar
	useEffect(() => {
		if (
			subscription?.daysRemaining !== null &&
			subscription?.daysRemaining !== undefined
		) {
			setDaysRemaining(subscription.daysRemaining);
		}
	}, [subscription?.daysRemaining]);
	const isLoading =
		isLoadingSubscription ||
		isStartingTrial ||
		isCreatingSubscription ||
		isCancelingSubscription;
	const [_daysRemaining, setDaysRemaining] = useState<number | null>(
		subscription?.daysRemaining ?? null,
	);

	useEffect(() => {
		if (subscription?.trialEnd) {
			const trialEndDate = subscription.trialEnd;
			const updateDaysRemaining = () => {
				const now = new Date();
				const trialEnd = new Date(trialEndDate);
				const diff = trialEnd.getTime() - now.getTime();
				const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
				setDaysRemaining(days);
			};

			updateDaysRemaining();
			const interval = setInterval(updateDaysRemaining, 60000); // Atualiza a cada minuto

			return () => clearInterval(interval);
		} else if (
			subscription?.daysRemaining !== null &&
			subscription?.daysRemaining !== undefined
		) {
			setDaysRemaining(subscription.daysRemaining);
		}
	}, [subscription?.trialEnd, subscription?.daysRemaining]);

	// Carregar dados do store ao montar
	const actions = useStudent("actions");
	const { updateSubscription } = actions;

	// NOTA: Não precisamos carregar manualmente aqui porque:
	// - useLoadPrioritized({ context: "payments" }) já carrega subscription, payments, paymentMethods, memberships
	// - Essas seções são carregadas automaticamente quando a página monta
	// - Carregar manualmente aqui causaria requisições duplicadas e loops

	// Usar dados do store (API → Zustand → Component)
	const membershipsData =
		storeMemberships && storeMemberships.length > 0
			? storeMemberships.map((m: StudentGymMembership) => ({
					...m,
					startDate: m.startDate
						? m.startDate instanceof Date
							? m.startDate
							: new Date(m.startDate)
						: new Date(),
					nextBillingDate: m.nextBillingDate
						? m.nextBillingDate instanceof Date
							? m.nextBillingDate
							: new Date(m.nextBillingDate)
						: undefined,
				}))
			: [];

	const paymentsData =
		storePayments && storePayments.length > 0
			? storePayments.map((p: StudentPayment) => ({
					...p,
					date: p.date
						? p.date instanceof Date
							? p.date
							: new Date(p.date)
						: new Date(),
					dueDate: p.dueDate
						? p.dueDate instanceof Date
							? p.dueDate
							: new Date(p.dueDate)
						: new Date(),
				}))
			: [];

	const paymentMethodsData = storePaymentMethods ?? [];
	const isLoadingMemberships = !storeMemberships;
	const isLoadingPayments = !storePayments;
	const isLoadingPaymentMethods = !storePaymentMethods;

	// Carregar loaders
	const loaders = useStudent("loaders");
	const { loadPaymentMethods, loadMemberships, loadPayments } = loaders;

	const [expandedMembershipId, setExpandedMembershipId] = useState<string | null>(null);
	const [changePlanPlans, setChangePlanPlans] = useState<
		Array<{ id: string; name: string; type: string; price: number; duration: number }>
	>([]);
	const [changePlanMembershipId, setChangePlanMembershipId] = useState<string | null>(null);
	const [pixModal, setPixModal] = useState<{
		paymentId: string;
		brCode: string;
		brCodeBase64: string;
		amount: number;
	} | null>(null);

	const _refetchPaymentMethods = async () => {
		await loadPaymentMethods();
	};

	const handleCancelMembership = async (membershipId: string) => {
		try {
			await apiClient.post(`/api/students/memberships/${membershipId}/cancel`, {});
			toast({ title: "Plano cancelado", description: "Sua matrícula foi cancelada." });
			setExpandedMembershipId(null);
			await loadMemberships();
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: { error?: string } } }).response?.data?.error
					: err instanceof Error ? err.message : "Erro ao cancelar";
			toast({ variant: "destructive", title: "Erro", description: String(msg) });
		}
	};

	const handleTrocarPlanoClick = async (membership: StudentGymMembership) => {
		try {
			const res = await apiClient.get<{ plans: Array<{ id: string; name: string; type: string; price: number; duration: number }> }>(
				`/api/students/gyms/${membership.gymId}/plans`,
			);
			const otherPlans = (res.data.plans || []).filter((p) => p.id !== membership.planId);
			if (otherPlans.length === 0) {
				toast({ title: "Sem opções", description: "Não há outros planos disponíveis nesta academia." });
				return;
			}
			setChangePlanPlans(otherPlans);
			setChangePlanMembershipId(membership.id);
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: { error?: string } } }).response?.data?.error
					: err instanceof Error ? err.message : "Erro ao carregar planos";
			toast({ variant: "destructive", title: "Erro", description: String(msg) });
		}
	};

	const handleSelectChangePlan = async (planId: string) => {
		if (!changePlanMembershipId) return;
		try {
			const res = await apiClient.post<{
				brCode: string;
				brCodeBase64: string;
				amount: number;
				paymentId: string;
			}>(`/api/students/memberships/${changePlanMembershipId}/change-plan`, { planId });
			setPixModal({
				paymentId: res.data.paymentId,
				brCode: res.data.brCode,
				brCodeBase64: res.data.brCodeBase64,
				amount: res.data.amount,
			});
			setChangePlanPlans([]);
			setChangePlanMembershipId(null);
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: { error?: string } } }).response?.data?.error
					: err instanceof Error ? err.message : "Erro ao trocar plano";
			toast({ variant: "destructive", title: "Erro", description: String(msg) });
		}
	};

	const handlePixConfirmed = async () => {
		await Promise.all([loadMemberships(), loadPayments()]);
	};

	// Usar dados do store (API → Zustand → Component)
	const memberships = membershipsData;
	const payments = paymentsData;
	const paymentMethods = paymentMethodsData;
	const _isLoadingData =
		isLoadingMemberships || isLoadingPayments || isLoadingPaymentMethods;

	const pendingPayments = payments.filter(
		(p: StudentPayment) => p.status === "pending" || p.status === "overdue",
	);
	const totalMonthly = memberships
		.filter((m: StudentGymMembership) => m.status === "active")
		.reduce((sum: number, m: StudentGymMembership) => sum + m.amount, 0);

	const handleStartTrial = async () => {
		try {
			const result = await startTrialHook();

			if (result.error) {
				if (result.error.includes("já existe")) {
					await refetchSubscription();
					setActiveTab("subscription");
					setSubTab("subscription");
					toast({
						title: "Assinatura encontrada",
						description: "Você já possui uma assinatura ativa.",
					});
				} else {
					toast({
						variant: "destructive",
						title: "Erro ao iniciar trial",
						description: result.error,
					});
				}
				return;
			}

			if (result.success) {
				setActiveTab("subscription");
				setSubTab("subscription");
				toast({
					title: "Trial iniciado",
					description: "Seu trial de 14 dias foi iniciado com sucesso!",
				});
			}
		} catch (error: unknown) {
			const msg =
				error instanceof Error
					? error.message
					: "Erro ao iniciar trial. Tente novamente.";
			toast({
				variant: "destructive",
				title: "Erro ao iniciar trial",
				description: msg,
			});
		}
	};

	const handleUpgrade = async (
		planId: string,
		billingPeriod: "monthly" | "annual",
	) => {
		try {
			// Usar a Server Action real para criar o checkout no Abacate Pay
			const result = await createAbacateBilling(planId, billingPeriod);

			if (result && result.url) {
				// Redirecionar para o Abacate Pay
				window.location.href = result.url;
			} else {
				throw new Error("URL de checkout não recebida do servidor.");
			}
		} catch (error: unknown) {
			console.error("[handleUpgrade] Erro:", error);
			const err = error as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			toast({
				variant: "destructive",
				title: "Erro ao ativar premium",
				description:
					err.response?.data?.message ||
					(err instanceof Error ? err.message : undefined) ||
					"Erro ao ativar premium. Tente novamente.",
			});
		}
	};

	const _handleCancelClick = () => {
		cancelDialogModal.open();
	};

	const handleCancelConfirm = async () => {
		cancelDialogModal.close();
		// O hook já faz o update otimista no Zustand e React Query antes de chamar o backend
		// A UI já está atualizada instantaneamente
		try {
			const result = await cancelSubscription();
			if (!result.success && result.error) {
				toast({
					variant: "destructive",
					title: "Erro ao cancelar",
					description: result.error,
				});
			} else {
				toast({
					title: "Assinatura cancelada",
					description: "Sua assinatura foi cancelada com sucesso.",
				});
			}
			// O hook já invalida e refetch automaticamente no onSuccess
		} catch (error: unknown) {
			const msg =
				error instanceof Error ? error.message : "Erro ao cancelar assinatura";
			toast({
				variant: "destructive",
				title: "Erro ao cancelar assinatura",
				description: msg,
			});
		}
	};

	const hasTrial =
		subscription?.trialEnd && new Date(subscription.trialEnd) > new Date();
	const isTrialActive =
		subscription &&
		subscription.plan.toLowerCase().includes("premium") &&
		(subscription.status === "trialing" || hasTrial);
	const _isPremiumActive =
		subscription?.plan.toLowerCase().includes("premium") &&
		subscription.status === "active" &&
		!hasTrial;
	// Considerar que não há subscription apenas se não estiver carregando e realmente não houver subscription
	const _hasNoSubscription =
		!isLoadingSubscription && !isStartingTrial && !subscription;

	const availablePlans = useMemo(() => [
		{
			id: "premium",
			name: "Premium",
			monthlyPrice: 15,
			annualPrice: 150.0,
			features: [
				"Gerador de treinos com IA",
				"Gerador de dietas com IA",
				"Análise de postura avançada",
				"Coach pessoal virtual",
				"Consultoria nutricional",
				"Relatórios avançados",
			],
		},
	], []);

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div className="text-center">
				<h1 className="mb-2 text-3xl font-bold text-duo-text">Pagamentos</h1>
				<p className="text-sm text-duo-gray-dark">
					Gerencie suas mensalidades e academias
				</p>
			</div>

			<DuoStatsGrid columns={2}>
				<DuoStatCard
					icon={DollarSign}
					value={`R$ ${totalMonthly.toFixed(2)}`}
					label="Total mensal"
					iconColor="var(--duo-primary)"
				/>
				<DuoStatCard
					icon={AlertCircle}
					value={String(pendingPayments.length)}
					label="Pendentes"
					iconColor={pendingPayments.length > 0 ? "var(--duo-accent)" : "var(--duo-secondary)"}
				/>
			</DuoStatsGrid>

			<DuoSectionCard title="Selecione a Categoria" icon={Wallet}>
				<OptionSelector
					options={TAB_OPTIONS}
					value={activeTab}
					onChange={(value) => {
						const newTab = value as
							| "memberships"
							| "payments"
							| "subscription";
						setActiveTab(newTab);
						setSubTab(value);
					}}
					layout="list"
					size="md"
					textAlign="center"
					animate={false}
				/>
			</DuoSectionCard>

			{activeTab === "memberships" && (
				<div className="space-y-3">
					{memberships.map((membership: StudentGymMembership) => {
						const isExpanded = expandedMembershipId === membership.id;
						const isActive = membership.status === "active";
						const isChangePlanSelecting =
							changePlanMembershipId === membership.id;

						return (
							<div key={membership.id}>
								<DuoCard
									variant="default"
									size="default"
									className={cn(
										"cursor-pointer transition-all",
										isExpanded && "border-duo-blue ring-2 ring-duo-blue/20",
									)}
									onClick={() =>
										setExpandedMembershipId(isExpanded ? null : membership.id)
									}
								>
									<div className="flex items-start gap-3">
										<div className="h-12 w-12 shrink-0 rounded-xl bg-duo-green/20 flex items-center justify-center">
											<Building2 className="h-6 w-6 text-duo-green" />
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-bold text-duo-text truncate">
												{membership.gymName}
											</h3>
											<p className="text-xs text-duo-gray-dark mt-0.5 line-clamp-2 break-words">
												{membership.gymAddress}
											</p>

											<div className="mt-3 flex flex-wrap items-center gap-2">
												<span
													className={cn(
														"px-2 py-1 rounded-lg text-xs font-bold shrink-0",
														membership.status === "active" &&
															"bg-duo-green/20 text-duo-green",
														membership.status === "suspended" &&
															"bg-duo-orange/20 text-duo-orange",
														membership.status === "canceled" &&
															"bg-duo-red/20 text-duo-red",
														membership.status === "pending" &&
															"bg-duo-yellow/20 text-duo-yellow",
													)}
												>
													{membership.status === "active" && "Ativo"}
													{membership.status === "suspended" && "Suspenso"}
													{membership.status === "canceled" && "Cancelado"}
													{membership.status === "pending" && "Pendente"}
												</span>
												{membership.autoRenew && (
													<span className="px-2 py-1 bg-duo-blue/20 text-duo-blue rounded-lg text-xs font-bold shrink-0">
														Renovação automática
													</span>
												)}
											</div>

											<div className="mt-3 pt-3 border-t-2 border-duo-border">
												<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
													<div className="min-w-0">
														<p className="text-xs text-duo-gray-dark">
															{membership.planName}
														</p>
														<p className="text-lg font-bold text-duo-green mt-0.5">
															R$ {membership.amount.toFixed(2)}/mês
														</p>
													</div>
													<div className="sm:text-right min-w-0">
														<p className="text-xs text-duo-gray-dark">
															Próxima cobrança
														</p>
														<p className="text-sm font-bold text-duo-text mt-0.5">
															{membership.nextBillingDate
																? new Date(membership.nextBillingDate).toLocaleDateString(
																		"pt-BR",
																	)
																: "N/A"}
														</p>
													</div>
												</div>
											</div>

											{isExpanded && isActive && (
												<div
													className="mt-4 pt-4 border-t-2 border-duo-border space-y-3"
													onClick={(e) => e.stopPropagation()}
												>
													{isChangePlanSelecting ? (
														<div className="space-y-2">
															<p className="text-xs font-bold text-duo-gray-dark">
																Selecione o novo plano:
															</p>
															{changePlanPlans.map((plan) => (
																<DuoCard
																	key={plan.id}
																	variant="default"
																	size="sm"
																	className="cursor-pointer hover:border-duo-blue"
																	onClick={() =>
																		handleSelectChangePlan(plan.id)
																	}
																>
																	<div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center min-w-0">
																		<span className="font-bold text-sm truncate">
																			{plan.name}
																		</span>
																		<span className="text-duo-green font-bold shrink-0">
																			R$ {plan.price.toFixed(2)}
																		</span>
																	</div>
																</DuoCard>
															))}
															<Button
																variant="ghost"
																size="sm"
																className="w-full sm:w-auto"
																onClick={() => {
																	setChangePlanPlans([]);
																	setChangePlanMembershipId(null);
																}}
															>
																Cancelar
															</Button>
														</div>
													) : (
														<div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
															<Button
																variant="outline"
																size="sm"
																className="w-full sm:flex-1 justify-center"
																onClick={() =>
																	handleTrocarPlanoClick(membership)
																}
															>
																<RefreshCw className="h-4 w-4 mr-1 shrink-0" />
																Trocar plano
															</Button>
															<Button
																variant="outline"
																size="sm"
																className="w-full sm:flex-1 justify-center border-duo-red text-duo-red hover:bg-duo-red/10"
																onClick={() =>
																	handleCancelMembership(membership.id)
																}
															>
																<Trash2 className="h-4 w-4 mr-1 shrink-0" />
																Cancelar plano
															</Button>
														</div>
													)}
												</div>
											)}

											{membership.paymentMethod && (
												<div className="mt-2 flex items-center gap-2 text-xs text-duo-gray-dark">
													<CreditCard className="h-4 w-4" />
													<span>
														{membership.paymentMethod.brand} ••••{" "}
														{membership.paymentMethod.last4}
													</span>
												</div>
											)}
										</div>
									</div>
								</DuoCard>
							</div>
						);
					})}

					<DuoCard
						variant="default"
						size="default"
						className="border-dashed cursor-pointer hover:border-duo-blue transition-colors"
						onClick={() => void setTab("gyms")}
					>
						<div className="flex items-center justify-center gap-2 py-2">
							<Plus className="h-5 w-5 text-duo-gray-dark" />
							<span className="font-bold text-duo-gray-dark">
								Adicionar nova academia
							</span>
						</div>
					</DuoCard>
				</div>
			)}

			{activeTab === "payments" && (
				<div className="space-y-3">
					{isLoadingPayments ? (
						<div className="text-center py-8 text-duo-gray-dark">
							Carregando pagamentos...
						</div>
					) : payments.length === 0 ? (
						<div className="text-center py-8 text-duo-gray-dark">
							Nenhum pagamento encontrado
						</div>
					) : (
						payments.map((payment: StudentPayment) => (
							<div key={payment.id}>
								<DuoCard variant="default" size="default">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h3 className="font-bold text-duo-text">
												{payment.gymName}
											</h3>
											<p className="text-xs text-duo-gray-dark mt-0.5">
												{payment.planName}
											</p>

											<div className="mt-2 flex items-center gap-2">
												<span
													className={cn(
														"px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1",
														payment.status === "paid" &&
															"bg-duo-green/20 text-duo-green",
														payment.status === "withdrawn" &&
															"bg-duo-blue/20 text-duo-blue",
														payment.status === "pending" &&
															"bg-duo-yellow/20 text-duo-yellow",
														payment.status === "overdue" &&
															"bg-duo-red/20 text-duo-red",
														payment.status === "canceled" &&
															"bg-gray-100 text-duo-gray-dark",
													)}
												>
													{payment.status === "paid" && (
														<>
															<CheckCircle className="h-3 w-3" /> Pago
														</>
													)}
													{payment.status === "withdrawn" && (
														<>
															<CheckCircle className="h-3 w-3" /> Sacado
														</>
													)}
													{payment.status === "pending" && (
														<>
															<AlertCircle className="h-3 w-3" /> Pendente
														</>
													)}
													{payment.status === "overdue" && (
														<>
															<AlertCircle className="h-3 w-3" /> Atrasado
														</>
													)}
													{payment.status === "canceled" && (
														<>
															<AlertCircle className="h-3 w-3" /> Cancelado
														</>
													)}
												</span>
											</div>

											<div className="mt-3 pt-3 border-t-2 border-duo-border flex items-center justify-between">
												<div>
													<p className="text-xs text-duo-gray-dark">
														Vencimento
													</p>
													<p className="text-sm font-bold text-duo-text mt-0.5">
														{payment.dueDate
															? new Date(payment.dueDate).toLocaleDateString("pt-BR")
															: "N/A"}
													</p>
												</div>
												<div className="text-right">
													<p className="text-xs text-duo-gray-dark">Valor</p>
													<p className="text-lg font-bold text-duo-green mt-0.5">
														R$ {payment.amount.toFixed(2)}
													</p>
												</div>
											</div>

											{payment.status === "pending" && (
												<Button className="w-full mt-3" size="sm">
													Pagar agora
												</Button>
											)}
										</div>
									</div>
								</DuoCard>
							</div>
						))
					)}
				</div>
			)}

			{activeTab === "subscription" && (
				<SubscriptionSection
					userType="student"
					subscription={subscription}
					isLoading={isLoading}
					isStartingTrial={isStartingTrial}
					isCreatingSubscription={isCreatingSubscription}
					isCancelingSubscription={isCancelingSubscription}
					onStartTrial={handleStartTrial}
					onSubscribe={handleUpgrade}
					onCancel={handleCancelConfirm}
					plans={availablePlans}
					showPlansWhen="always"
				/>
			)}

			<SubscriptionCancelDialog
				open={cancelDialogModal.isOpen}
				onOpenChange={(open) => {
					if (open) {
						cancelDialogModal.open();
					} else {
						cancelDialogModal.close();
					}
				}}
				onConfirm={handleCancelConfirm}
				isTrial={!!isTrialActive}
				isLoading={isCancelingSubscription}
			/>

			{pixModal && (
				<StudentMembershipPixModal
					isOpen={true}
					onClose={() => setPixModal(null)}
					paymentId={pixModal.paymentId}
					brCode={pixModal.brCode}
					brCodeBase64={pixModal.brCodeBase64}
					amount={pixModal.amount}
					onPaymentConfirmed={handlePixConfirmed}
				/>
			)}
		</div>
	);
}
