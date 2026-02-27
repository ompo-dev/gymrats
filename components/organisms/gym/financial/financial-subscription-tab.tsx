"use client";

import { useState, useEffect } from "react";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import { useGymSubscription } from "@/hooks/use-gym-subscription";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { PixPaymentModal } from "./pix-payment-modal";

interface FinancialSubscriptionTabProps {
	subscription?: {
		id: string;
		plan: string;
		status: string;
		basePrice: number;
		pricePerStudent: number;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		cancelAtPeriodEnd: boolean;
		canceledAt: Date | null;
		trialStart: Date | null;
		trialEnd: Date | null;
		isTrial: boolean;
		daysRemaining: number | null;
		activeStudents: number;
		totalAmount: number;
	} | null;
}

const PENDING_PIX_KEY = "gym-pending-pix";
const PIX_EXPIRY_MS = 55 * 60 * 1000; // 55 min (PIX vale 1h)

function loadPendingPixFromStorage(): {
	pixId: string;
	brCode: string;
	brCodeBase64: string;
	amount: number;
} | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = sessionStorage.getItem(PENDING_PIX_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as { pixId: string; brCode: string; brCodeBase64?: string; amount: number; createdAt: number };
		if (Date.now() - data.createdAt > PIX_EXPIRY_MS) {
			sessionStorage.removeItem(PENDING_PIX_KEY);
			return null;
		}
		return { pixId: data.pixId, brCode: data.brCode, brCodeBase64: data.brCodeBase64 ?? "", amount: data.amount };
	} catch {
		return null;
	}
}

function savePendingPixToStorage(pix: { pixId: string; brCode: string; brCodeBase64: string; amount: number }) {
	sessionStorage.setItem(PENDING_PIX_KEY, JSON.stringify({ ...pix, createdAt: Date.now() }));
}

function clearPendingPixStorage() {
	sessionStorage.removeItem(PENDING_PIX_KEY);
}

export function FinancialSubscriptionTab({
	subscription: initialSubscription,
}: FinancialSubscriptionTabProps) {
	const { toast } = useToast();
	const { gymSubscription: storeSubscription } = useSubscriptionStore();
	const [pendingPix, setPendingPix] = useState<{
		pixId: string;
		brCode: string;
		brCodeBase64: string;
		amount: number;
	} | null>(null);

	const {
		subscription: subscriptionData,
		isLoading: isLoadingSubscription,
		startTrial: startTrialHook,
		isStartingTrial,
		createSubscription,
		isCreatingSubscription,
		cancelSubscription,
		isCancelingSubscription,
		refetch: refetchSubscription,
	} = useGymSubscription({
		includeDaysRemaining: true,
		includeTrialInfo: true,
		includeActiveStudents: true,
	});

	type SubscriptionType = typeof initialSubscription;

	const hasOptimisticUpdate =
		storeSubscription?.id === "temp-trial-id" ||
		(subscriptionData &&
			typeof subscriptionData === "object" &&
			"id" in subscriptionData &&
			(subscriptionData as { id?: string }).id === "temp-trial-id");

	const subscription: SubscriptionType =
		hasOptimisticUpdate && storeSubscription
			? (storeSubscription as SubscriptionType)
			: subscriptionData !== undefined && subscriptionData !== null
				? (subscriptionData as SubscriptionType)
				: storeSubscription !== null
					? (storeSubscription as SubscriptionType)
					: subscriptionData === null && initialSubscription
						? initialSubscription
						: subscriptionData === null
							? null
							: initialSubscription;

	// Restaurar PIX pendente ao voltar (ex.: fechou modal, foi ao banco, voltou)
	useEffect(() => {
		if (isLoadingSubscription) return;
		const stored = loadPendingPixFromStorage();
		if (!stored) return;
		if (subscriptionData?.status === "active") {
			clearPendingPixStorage();
			return;
		}
		if (subscriptionData?.status === "pending") {
			setPendingPix(stored);
		}
	}, [isLoadingSubscription, subscriptionData?.status]);

	// Refetch ao voltar para a aba (ex.: foi ao app do banco pagar)
	useEffect(() => {
		const hasPending = pendingPix || loadPendingPixFromStorage();
		if (!hasPending) return;
		const onFocus = () => refetchSubscription();
		window.addEventListener("focus", onFocus);
		return () => window.removeEventListener("focus", onFocus);
	}, [pendingPix, refetchSubscription]);

	const handleStartTrial = async () => {
		try {
			const result = await startTrialHook();
			if (result.error) {
				if (result.error.includes("já existe")) {
					await refetchSubscription();
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
			} else {
				toast({
					title: "Trial iniciado",
					description: "Seu trial de 14 dias foi iniciado com sucesso!",
				});
			}
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Erro ao iniciar trial";
			toast({
				variant: "destructive",
				title: "Erro ao iniciar trial",
				description: msg,
			});
		}
	};

	const handleSubscribe = async (
		plan: string,
		billingPeriod: "monthly" | "annual",
	) => {
		try {
			const result = await createSubscription(
				plan as "basic" | "premium" | "enterprise",
				billingPeriod,
			);
			if (result.error) {
				toast({
					variant: "destructive",
					title: "Erro ao criar assinatura",
					description: result.error,
				});
				return;
			}
			// Gym usa PIX inline (valor dinâmico, sem produtos)
			const pix = result as { pixId?: string; brCode?: string; brCodeBase64?: string; amount?: number };
			if (pix.pixId && pix.brCode) {
				await refetchSubscription();
				const pixData = {
					pixId: pix.pixId,
					brCode: pix.brCode,
					brCodeBase64: pix.brCodeBase64 ?? "",
					amount: pix.amount ?? 0,
				};
				setPendingPix(pixData);
				savePendingPixToStorage(pixData);
			}
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Erro ao criar cobrança";
			toast({
				variant: "destructive",
				title: "Erro ao criar cobrança",
				description: msg,
			});
		}
	};

	const handleCancel = async () => {
		try {
			// A atualização otimista já acontece no hook, então a UI já está atualizada
			const result = await cancelSubscription();
			if (!result.success && result.error) {
				toast({
					variant: "destructive",
					title: "Erro ao cancelar",
					description: result.error || "Erro ao cancelar assinatura",
				});
			} else {
				toast({
					title: "Assinatura cancelada",
					description: "Sua assinatura foi cancelada com sucesso.",
				});
			}
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Erro ao cancelar assinatura";
			toast({
				variant: "destructive",
				title: "Erro ao cancelar assinatura",
				description: msg,
			});
		}
	};

	// Preços mensais base (em reais)
	const monthlyBasePrices = {
		basic: 150,
		premium: 250,
		enterprise: 400,
	};

	// Preços por aluno/mês (em reais)
	const perStudentPrices = {
		basic: 1.5,
		premium: 1,
		enterprise: 0.5,
	};

	// Preços anuais com descontos diferenciados (em reais)
	// No plano anual, não há cobrança por aluno
	// Basic: 5% desconto, Premium: 10% desconto, Enterprise: 15% desconto
	const annualPrices = {
		basic: Math.round(monthlyBasePrices.basic * 12 * 0.95), // 5% desconto
		premium: Math.round(monthlyBasePrices.premium * 12 * 0.9), // 10% desconto
		enterprise: Math.round(monthlyBasePrices.enterprise * 12 * 0.85), // 15% desconto
	};

	return (
		<>
		<SubscriptionSection.Simple
			userType="gym"
			subscription={
				subscription
					? {
							id: subscription.id,
							plan: subscription.plan,
							status: subscription.status,
							currentPeriodStart: subscription.currentPeriodStart,
							currentPeriodEnd: subscription.currentPeriodEnd,
							cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
							canceledAt: subscription.canceledAt,
							trialStart: subscription.trialStart,
							trialEnd: subscription.trialEnd,
							isTrial: subscription.isTrial,
							daysRemaining: subscription.daysRemaining,
							activeStudents: subscription.activeStudents,
							totalAmount: subscription.totalAmount,
							billingPeriod: (subscription as { billingPeriod?: "monthly" | "annual" }).billingPeriod ?? "monthly",
						}
					: null
			}
			onPaymentSuccess={refetchSubscription}
			isLoading={isLoadingSubscription}
			isStartingTrial={isStartingTrial}
			isCreatingSubscription={isCreatingSubscription}
			isCancelingSubscription={isCancelingSubscription}
			onStartTrial={handleStartTrial}
			onSubscribe={handleSubscribe}
			onCancel={handleCancel}
			plans={[
				{
					id: "basic",
					name: "Básico",
					monthlyPrice: monthlyBasePrices.basic,
					annualPrice: annualPrices.basic,
					perStudentPrice: perStudentPrices.basic,
					features: [
						"Gestão completa de alunos",
						"Dashboard básico",
						"Premium gratuito para todos os alunos",
						"Relatórios básicos",
						"Suporte por email",
					],
				},
				{
					id: "premium",
					name: "Premium",
					monthlyPrice: monthlyBasePrices.premium,
					annualPrice: annualPrices.premium,
					perStudentPrice: perStudentPrices.premium,
					features: [
						"Gestão completa de alunos",
						"Dashboard avançado",
						"Premium gratuito para todos os alunos",
						"Relatórios detalhados",
						"Suporte prioritário",
						"Integrações avançadas",
					],
				},
				{
					id: "enterprise",
					name: "Enterprise",
					monthlyPrice: monthlyBasePrices.enterprise,
					annualPrice: annualPrices.enterprise,
					perStudentPrice: perStudentPrices.enterprise,
					features: [
						"Gestão completa de alunos",
						"Dashboard empresarial",
						"Premium gratuito para todos os alunos",
						"Relatórios personalizados",
						"Suporte dedicado 24/7",
						"Integrações ilimitadas",
						"API personalizada",
					],
				},
			]}
			showPlansWhen="always"
			trialEndingDays={3}
			texts={{
				trialTitle: "Experimente 14 dias grátis!",
				trialDescription:
					"Teste todas as funcionalidades Premium sem compromisso",
				trialButton: "Iniciar Trial Grátis",
				subscriptionStatusTitle: "Status da Assinatura",
				upgradeTitle: "Fazer Upgrade para Premium",
				choosePlanTitle: "Escolha seu Plano",
				subscribeButton: "Assinar Agora",
				cancelTrialButton: "Cancelar Trial",
				cancelSubscriptionButton: "Cancelar Assinatura",
				nextRenewal: "Próxima renovação",
			}}
		/>
		{pendingPix && (
			<PixPaymentModal
				isOpen={!!pendingPix}
				onClose={() => {
					setPendingPix(null);
					toast({
						title: "PIX salvo",
						description: "Volte aqui para ver o PIX novamente ou verificar se o pagamento foi confirmado.",
					});
				}}
				onPaymentConfirmed={() => {
					clearPendingPixStorage();
					refetchSubscription();
				}}
				pixId={pendingPix.pixId}
				brCode={pendingPix.brCode}
				brCodeBase64={pendingPix.brCodeBase64}
				amount={pendingPix.amount}
				refetchSubscription={refetchSubscription}
				subscriptionStatus={subscription?.status}
				initialStatus="pending"
			/>
		)}
		</>
	);
}
