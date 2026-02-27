"use client";

import { useEffect } from "react";
import { DuoCard } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionUIStore } from "@/stores/subscription-ui-store";
import { createAbacateBilling, confirmAbacatePayment } from "@/lib/actions/abacate-pay";
import { hasActivePremiumStatus } from "@/lib/utils/subscription-helpers";
import { PlansSelector } from "./subscription/plans-selector";
import { SubscriptionStatus } from "./subscription/subscription-status";
import { TrialOffer } from "./subscription/trial-offer";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";

export interface SubscriptionPlan {
	id: string;
	name: string;
	monthlyPrice: number;
	annualPrice: number;
	features: string[];
	perStudentPrice?: number; // Preço por aluno/mês (apenas para gym, plano mensal)
}

export interface SubscriptionSectionProps {
	// Tipo de usuário
	userType: "student" | "gym";

	// Estado da subscription
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
		activeStudents?: number;
		totalAmount?: number;
		billingPeriod?: "monthly" | "annual"; // Período de cobrança atual
	} | null;

	// Estados de loading
	isLoading?: boolean;
	isStartingTrial?: boolean;
	isCreatingSubscription?: boolean;
	isCancelingSubscription?: boolean;

	// Callbacks
	onStartTrial: () => Promise<void>;
	onSubscribe: (
		plan: string,
		billingPeriod: "monthly" | "annual",
	) => Promise<void>;
	onCancel: () => Promise<void>;
	/** Chamado após confirmar pagamento (ex.: refetch da assinatura). Para gym, passar refetch do useGymSubscription. */
	onPaymentSuccess?: () => Promise<void>;

	// Configurações de planos
	plans: SubscriptionPlan[];

	// Textos customizáveis
	texts?: {
		trialTitle?: string;
		trialDescription?: string;
		trialButton?: string;
		trialDaysRemaining?: string;
		trialValidUntil?: string;
		subscriptionStatusTitle?: string;
		upgradeTitle?: string;
		choosePlanTitle?: string;
		subscribeButton?: string;
		cancelTrialButton?: string;
		cancelSubscriptionButton?: string;
		nextRenewal?: string;
		monthlyLabel?: string;
		annualLabel?: string;
		saveLabel?: string;
		perMonth?: string;
		perYear?: string;
	};

	// Configurações de exibição
	showPlansWhen?:
		| "always"
		| "no-subscription"
		| "trial-active"
		| "trial-ending";
	trialEndingDays?: number;
}

export function SubscriptionSection({
	userType,
	subscription,
	isLoading = false,
	isStartingTrial = false,
	isCreatingSubscription = false,
	isCancelingSubscription = false,
	onStartTrial,
	onSubscribe,
	onCancel,
	onPaymentSuccess,
	plans,
	texts = {},
	showPlansWhen = "no-subscription",
	trialEndingDays = 3,
}: SubscriptionSectionProps) {
	const {
		selectedPlan,
		selectedBillingPeriod,
		isProcessingPayment,
		setSelectedPlan,
		setSelectedBillingPeriod,
		setIsProcessingPayment,
		initializeFromSubscription,
	} = useSubscriptionUIStore();

	const { toast } = useToast();
	const searchParams = useSearchParams();
	const isSuccess = searchParams.get("success") === "true";
	const { loadSubscription } = useStudent("loaders");

	// Efeito para confirmar pagamento e ativar assinatura quando volta do Abacate Pay com sucesso
	useEffect(() => {
		if (!isSuccess) return;

		let cancelled = false;

		const confirmPayment = async () => {
			toast({
				title: "Pagamento recebido!",
				description: "Verificando e ativando sua assinatura...",
			});

			// Para gym: webhook ativa a assinatura. Refetch com polling até obter dados atualizados.
			if (userType === "gym" && onPaymentSuccess) {
				for (let i = 0; i < 10; i++) {
					if (cancelled) return;
					await onPaymentSuccess();
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
				toast({
					title: "Assinatura Ativada! 🎉",
					description: "Seu plano está ativo. Aproveite!",
				});
				const url = new URL(window.location.href);
				url.searchParams.delete("success");
				window.history.replaceState({}, "", url.toString());
				return;
			}

			// Student: polling via confirmAbacatePayment
			for (let i = 0; i < 10; i++) {
				if (cancelled) return;

				try {
					const result = await confirmAbacatePayment();
					if (result.success) {
						await loadSubscription();
						toast({
							title: "Assinatura Ativada! 🎉",
							description: `Seu plano ${result.subscription?.plan || "Premium"} está ativo. Aproveite!`,
						});
						const url = new URL(window.location.href);
						url.searchParams.delete("success");
						window.history.replaceState({}, "", url.toString());
						return;
					}
				} catch (error) {
					console.error("[SubscriptionSection] Erro ao confirmar pagamento:", error);
				}

				await new Promise((resolve) => setTimeout(resolve, 3000));
			}

			await loadSubscription();
		};

		confirmPayment();

		return () => {
			cancelled = true;
		};
	}, [isSuccess, loadSubscription, toast, userType, onPaymentSuccess]);

	// Inicializar estado baseado na subscription atual
	const prevSubscriptionId = useRef<string | null>(null);

	useEffect(() => {
		if (plans.length > 0) {
			// Apenas re-inicializar se a assinatura mudou de verdade (ID ou plano base)
			const subId = subscription?.id || "no-subscription";
			const subPlan = subscription?.plan || "free";
			const subPeriod = subscription?.billingPeriod || "monthly";
			const checkKey = `${subId}-${subPlan}-${subPeriod}`;

			if (prevSubscriptionId.current !== checkKey) {
				console.log("[Subscription] Re-inicializando UI Store:", checkKey);
				initializeFromSubscription(
					plans,
					subscription?.plan,
					subscription?.billingPeriod,
					userType,
				);
				prevSubscriptionId.current = checkKey;
			}
		}
	}, [
		plans,
		subscription?.id,
		subscription?.plan,
		subscription?.billingPeriod,
		userType,
		initializeFromSubscription,
	]);

	// Textos padrão
	const defaultTexts = {
		trialTitle: "Experimente 14 dias grátis!",
		trialDescription: "Teste todas as funcionalidades Premium sem compromisso",
		trialButton: "Iniciar Trial Grátis",
		trialDaysRemaining: "dias restantes",
		trialValidUntil: "Válido até",
		subscriptionStatusTitle: "Status da Assinatura",
		upgradeTitle: "Fazer Upgrade para Premium",
		choosePlanTitle: "Escolha seu Plano",
		subscribeButton: "Assinar Agora",
		cancelTrialButton: "Cancelar Trial",
		cancelSubscriptionButton: "Cancelar Assinatura",
		nextRenewal: "Próxima renovação",
		monthlyLabel: "Mensal",
		annualLabel: "Anual",
		saveLabel: "Economize",
		perMonth: "por mês",
		perYear: "por ano",
	};

	const finalTexts = { ...defaultTexts, ...texts };

	const isLoadingState = isLoading || isStartingTrial || isCreatingSubscription;

	const hasTrial = !!(
		subscription?.status === "trialing" &&
		subscription?.trialEnd && 
		new Date(subscription.trialEnd) > new Date()
	);
	const isCanceled = subscription?.status === "canceled" || false;
	const isTrialActive = subscription?.status === "trialing";
	const isPremiumActive = subscription?.status === "active";
	const isPendingPayment = subscription?.status === "pending_payment";
	const isCanceledAndTrialExpired = isCanceled && !hasTrial;
	const hasNoSubscription =
		(!isLoading && !isStartingTrial && !subscription) ||
		isCanceledAndTrialExpired;

	const daysRemaining = subscription?.daysRemaining ?? null;
	const isTrialEnding =
		isTrialActive && daysRemaining !== null && daysRemaining <= trialEndingDays;

	// Determinar quando mostrar os planos
	// Para gym: sempre mostrar planos quando há subscription (para permitir upgrade/downgrade)
	// Para student: apenas mostrar opção de mudar para anual se estiver no mensal
	const shouldShowPlans = (() => {
		// Se há subscription ativa
		if (subscription && isPremiumActive) {
			// Para student: apenas mostrar se estiver no plano mensal (para mudar para anual)
			if (userType === "student") {
				const currentBillingPeriod = subscription.billingPeriod || "monthly";
				// Se estiver no plano anual, não mostrar opções de planos
				if (currentBillingPeriod === "annual") {
					return false;
				}
				// Se estiver no plano mensal, mostrar apenas opção de mudar para anual
				return true;
			}
			// Para gym: sempre mostrar todos os planos (para permitir upgrade/downgrade)
			return true;
		}

		// Se há subscription em trial ou cancelada, mostrar planos normalmente
		if (subscription && (isTrialActive || isCanceled)) {
			return true;
		}

		// Se não há subscription, mostrar baseado na configuração
		switch (showPlansWhen) {
			case "always":
				// Para student com subscription ativa anual, não mostrar mesmo com "always"
				if (userType === "student" && subscription && isPremiumActive) {
					const currentBillingPeriod = subscription.billingPeriod || "monthly";
					return currentBillingPeriod === "monthly";
				}
				return true;
			case "no-subscription":
				return hasNoSubscription;
			case "trial-active":
				return isTrialActive;
			case "trial-ending":
				return isTrialEnding;
			default:
				return hasNoSubscription;
		}
	})();

	const selectedPlanData = plans.find((p) => p.id === selectedPlan) || plans[0];
	const displayPrice =
		selectedBillingPeriod === "annual"
			? selectedPlanData?.annualPrice
			: selectedPlanData?.monthlyPrice;

	// Calcular desconto anual baseado no plano
	const getAnnualDiscount = (planId: string): number => {
		const discounts: Record<string, number> = {
			basic: 5, // 5% desconto
			premium: 10, // 10% desconto
			enterprise: 15, // 15% desconto
		};
		return discounts[planId] || 10; // Default 10% se não encontrar
	};

	const annualDiscount = selectedPlanData
		? getAnnualDiscount(selectedPlanData.id)
		: 10;


	const handleSubscribe = async () => {
		if (!selectedPlanData) return;

		// Se o componente pai forneceu um callback, usar ele (mantém consistência)
		if (onSubscribe) {
			await onSubscribe(selectedPlanData.id, selectedBillingPeriod);
			return;
		}

		// Fallback para comportamento padrão (checkout direto)
		setIsProcessingPayment(true);
		try {
			console.log("[Subscription] Iniciando checkout direto para:", selectedPlanData.id, selectedBillingPeriod);
			const result = await createAbacateBilling(
				selectedPlanData.id,
				selectedBillingPeriod,
			);

			if (result && result.url) {
				window.location.href = result.url;
			} else {
				throw new Error("URL de checkout não recebida do servidor.");
			}
		} catch (error: any) {
			console.error("[Subscription] Erro no checkout:", error);
			toast({
				variant: "destructive",
				title: "Erro ao iniciar checkout",
				description: error.message || "Erro ao processar checkout.",
			});
		} finally {
			setIsProcessingPayment(false);
		}
	};


	return (
		<div className="space-y-4">
			{/* Loading State */}
			{(isLoading || isStartingTrial) && !subscription && (
				<DuoCard.Root variant="default" size="default" className="text-center">
					<p className="text-sm text-duo-gray-dark">
						{isStartingTrial ? "Iniciando trial..." : "Carregando..."}
					</p>
				</DuoCard.Root>
			)}

			{/* Trial Offer - Mostrar apenas se não há subscription */}
			{!isLoading && !isStartingTrial && hasNoSubscription && (
				<TrialOffer
					title={finalTexts.trialTitle}
					description={finalTexts.trialDescription}
					buttonText={finalTexts.trialButton}
					isLoading={isLoadingState}
					onStartTrial={onStartTrial}
				/>
			)}

			{/* Subscription Status */}
			{subscription && (
				<SubscriptionStatus
					subscription={subscription}
					userType={userType}
					texts={{
						subscriptionStatusTitle: finalTexts.subscriptionStatusTitle,
						trialDaysRemaining: finalTexts.trialDaysRemaining,
						trialValidUntil: finalTexts.trialValidUntil,
						cancelTrialButton: finalTexts.cancelTrialButton,
						cancelSubscriptionButton: finalTexts.cancelSubscriptionButton,
						nextRenewal: finalTexts.nextRenewal,
					}}
					isCanceled={!!isCanceled}
					hasTrial={!!hasTrial}
					isTrialActive={isTrialActive}
					isPremiumActive={isPremiumActive}
					isPendingPayment={isPendingPayment}
					daysRemaining={daysRemaining}
					isLoading={isLoadingState}
					onStartTrial={onStartTrial}
					onCancel={onCancel}
				/>
			)}

			{/* Plans Selector */}
			{shouldShowPlans && (
				<PlansSelector
					userType={userType}
					plans={plans}
					selectedPlan={selectedPlan}
					onSelectPlan={setSelectedPlan}
					selectedBillingPeriod={selectedBillingPeriod}
					onSelectBillingPeriod={setSelectedBillingPeriod}
					isPremiumActive={!!isPremiumActive}
					isTrialActive={!!isTrialActive}
					annualDiscount={annualDiscount}
					currentSubscriptionPlan={
						subscription?.plan
							? String(subscription.plan).toLowerCase().trim()
							: undefined
					}
					currentSubscriptionBillingPeriod={
						subscription?.billingPeriod
							? (subscription.billingPeriod as "monthly" | "annual")
							: subscription?.plan
								? ("monthly" as "monthly" | "annual") // Default para monthly se não tiver billingPeriod
								: undefined
					}
					texts={{
						upgradeTitle: finalTexts.upgradeTitle,
						choosePlanTitle: finalTexts.choosePlanTitle,
						subscribeButton: finalTexts.subscribeButton,
						monthlyLabel: finalTexts.monthlyLabel,
						annualLabel: finalTexts.annualLabel,
						perMonth: finalTexts.perMonth,
						perYear: finalTexts.perYear,
					}}
					isLoading={isLoadingState}
					onSubscribe={handleSubscribe}
				/>
			)}

		</div>
	);
}
