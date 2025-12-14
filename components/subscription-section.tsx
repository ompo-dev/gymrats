"use client";

import { useEffect } from "react";
import { DuoCard } from "@/components/ui/duo-card";
import { TrialOffer } from "./subscription/trial-offer";
import { SubscriptionStatus } from "./subscription/subscription-status";
import { PlansSelector } from "./subscription/plans-selector";
import { PaymentModal } from "./subscription/payment-modal";
import { useSubscriptionUIStore } from "@/stores/subscription-ui-store";

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
    billingPeriod: "monthly" | "annual"
  ) => Promise<void>;
  onCancel: () => Promise<void>;

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
  plans,
  texts = {},
  showPlansWhen = "no-subscription",
  trialEndingDays = 3,
}: SubscriptionSectionProps) {
  const {
    selectedPlan,
    selectedBillingPeriod,
    showPaymentModal,
    isProcessingPayment,
    setSelectedPlan,
    setSelectedBillingPeriod,
    setShowPaymentModal,
    setIsProcessingPayment,
    initializeFromSubscription,
  } = useSubscriptionUIStore();

  // Inicializar estado baseado na subscription atual
  useEffect(() => {
    if (plans.length > 0) {
      initializeFromSubscription(
        plans,
        subscription?.plan,
        subscription?.billingPeriod,
        userType
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length, subscription?.plan, subscription?.billingPeriod, userType]);

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
    subscription?.trialEnd && new Date(subscription.trialEnd) > new Date()
  );
  const isCanceled = subscription?.status === "canceled" || false;
  const isTrialActive = !!(
    subscription &&
    (subscription.status === "trialing" || hasTrial)
  );
  const isPremiumActive = !!(
    subscription &&
    subscription.status === "active" &&
    !hasTrial
  );
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
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlanData) return;

    setIsProcessingPayment(true);
    try {
      await onSubscribe(selectedPlanData.id, selectedBillingPeriod);
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleClosePaymentModal = (open: boolean) => {
    setShowPaymentModal(open);
  };

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {(isLoading || isStartingTrial) && !subscription && (
        <DuoCard variant="default" size="default" className="text-center">
          <p className="text-sm text-duo-gray-dark">
            {isStartingTrial ? "Iniciando trial..." : "Carregando..."}
          </p>
        </DuoCard>
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
          isTrialActive={!!isTrialActive}
          isPremiumActive={!!isPremiumActive}
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

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={handleClosePaymentModal}
        selectedPlan={selectedPlanData}
        billingPeriod={selectedBillingPeriod}
        displayPrice={displayPrice}
        onConfirm={handleConfirmPayment}
        isProcessing={isProcessingPayment}
      />
    </div>
  );
}
