"use client";

import { useEffect, useState, useMemo } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { createAbacateBilling } from "@/lib/actions/abacate-pay";
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
	StudentGymMembership,
	StudentPayment,
} from "@/lib/types";

export type PaymentsTab = "memberships" | "payments" | "subscription";

export interface UsePaymentsPageProps {
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

export function usePaymentsPage(props: UsePaymentsPageProps = {}) {
	const { subscription: initialSubscription, startTrial: _startTrial } = props;

	useLoadPrioritized({ context: "payments" });

	const { toast } = useToast();
	const [subTab, setSubTab] = useQueryState(
		"subTab",
		parseAsString.withDefault("memberships"),
	);
	const [, setTab] = useQueryState("tab", parseAsString.withDefault("home"));

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
		enabled: false,
	});

	const cancelDialogModal = useModalState("cancel-subscription");

	const [activeTab, setActiveTab] = useState<PaymentsTab>("memberships");
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
	const [_daysRemaining, setDaysRemaining] = useState<number | null>(null);

	useEffect(() => {
		if (subTab && ["memberships", "payments", "subscription"].includes(subTab)) {
			setActiveTab(subTab as PaymentsTab);
		}
	}, [subTab]);

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
			const interval = setInterval(updateDaysRemaining, 60000);

			return () => clearInterval(interval);
		} else if (
			subscription?.daysRemaining !== null &&
			subscription?.daysRemaining !== undefined
		) {
			setDaysRemaining(subscription.daysRemaining);
		}
	}, [subscription?.trialEnd, subscription?.daysRemaining]);

	const loaders = useStudent("loaders");
	const { loadPaymentMethods, loadMemberships, loadPayments } = loaders;

	const membershipsData = useMemo(() => {
		if (!storeMemberships || storeMemberships.length === 0) return [];
		return storeMemberships.map((m: StudentGymMembership) => ({
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
		}));
	}, [storeMemberships]);

	const paymentsData = useMemo(() => {
		if (!storePayments || storePayments.length === 0) return [];
		return storePayments.map((p: StudentPayment) => ({
			...p,
			date: p.date
				? p.date instanceof Date ? p.date : new Date(p.date)
				: new Date(),
			dueDate: p.dueDate
				? p.dueDate instanceof Date ? p.dueDate : new Date(p.dueDate)
				: new Date(),
		}));
	}, [storePayments]);

	const memberships = membershipsData;
	const payments = paymentsData;
	const isLoadingPayments = !storePayments;

	const pendingPayments = payments.filter(
		(p: StudentPayment) => p.status === "pending" || p.status === "overdue",
	);
	const totalMonthly = memberships
		.filter((m: StudentGymMembership) => m.status === "active")
		.reduce((sum: number, m: StudentGymMembership) => sum + m.amount, 0);

	const availablePlans = useMemo(
		() => [
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
		],
		[],
	);

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
			const res = await apiClient.get<{
				plans: Array<{ id: string; name: string; type: string; price: number; duration: number }>;
			}>(`/api/students/gyms/${membership.gymId}/plans`);
			const otherPlans = (res.data.plans || []).filter((p) => p.id !== membership.planId);
			if (otherPlans.length === 0) {
				toast({
					title: "Sem opções",
					description: "Não há outros planos disponíveis nesta academia.",
				});
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
			await Promise.all([loadMemberships(), loadPayments()]);
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

	const handlePayNowClick = async (payment: StudentPayment) => {
		try {
			const res = await apiClient.post<{
				paymentId: string;
				brCode: string;
				brCodeBase64: string;
				amount: number;
			}>(`/api/students/payments/${payment.id}/pay-now`, {});
			setPixModal({
				paymentId: res.data.paymentId,
				brCode: res.data.brCode,
				brCodeBase64: res.data.brCodeBase64,
				amount: res.data.amount,
			});
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: { error?: string } } }).response?.data?.error
					: err instanceof Error ? err.message : "Erro ao gerar PIX";
			toast({ variant: "destructive", title: "Erro", description: String(msg) });
		}
	};

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
			const result = await createAbacateBilling(planId, billingPeriod);

			if (result && result.url) {
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

	const handleCancelConfirm = async () => {
		cancelDialogModal.close();
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

	const setTabChange = (value: PaymentsTab) => {
		setActiveTab(value);
		setSubTab(value);
	};

	return {
		// State
		activeTab,
		subscription,
		memberships,
		payments,
		pendingPayments,
		totalMonthly,
		availablePlans,
		isLoading,
		isLoadingPayments,
		isStartingTrial,
		isCreatingSubscription,
		isCancelingSubscription,
		isTrialActive,

		// UI state
		expandedMembershipId,
		setExpandedMembershipId,
		changePlanPlans,
		changePlanMembershipId,
		setChangePlanPlans,
		setChangePlanMembershipId,
		pixModal,
		setPixModal,

		// Modals
		cancelDialogModal,

		// Handlers
		setTab,
		setTabChange,
		handleCancelMembership,
		handleTrocarPlanoClick,
		handleSelectChangePlan,
		handlePixConfirmed,
		handlePayNowClick,
		handleStartTrial,
		handleUpgrade,
		handleCancelConfirm,
	};
}
