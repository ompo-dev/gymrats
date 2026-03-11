"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { DuoCard } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import {
  confirmAbacatePayment,
  createAbacateBilling,
} from "@/lib/actions/payments/abacate-pay";
import type { SubscriptionData as StudentSubscriptionData } from "@/lib/types/student-unified";
import { useSubscriptionUIStore } from "@/stores/subscription-ui-store";
import { PlansSelector } from "./subscription/plans-selector";
import { SubscriptionStatus } from "./subscription/subscription-status";
import { TrialOffer } from "./subscription/trial-offer";

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  perStudentPrice?: number; // Preço por aluno/mês (apenas para gym, plano mensal)
}

export interface SubscriptionSectionProps {
  userType: "student" | "gym" | "personal";

  /** Subscription do student ou gym; datas e id podem ser opcionais (ex.: virtual enterprise). Gym pode passar activeStudents/totalAmount. */
  subscription?:
    | (StudentSubscriptionData & {
        activeStudents?: number;
        totalAmount?: number;
      })
    | null;

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
    referralCode?: string | null,
  ) => Promise<void>;
  onCancel: () => Promise<void>;
  /** Primeira assinatura (para mostrar campo @) */
  isFirstPayment?: boolean;
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

function SubscriptionSectionSimple({
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
  isFirstPayment = false,
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
          console.error(
            "[SubscriptionSection] Erro ao confirmar pagamento:",
            error,
          );
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

  // Trial só uma vez: ocultar oferta se já usou trial ou já assinou (canStartTrial === false)
  // Personal não tem trial
  const canStartTrial =
    userType === "personal"
      ? false
      : subscription == null ||
        ("canStartTrial" in subscription && subscription.canStartTrial !== false);

  const daysRemaining = subscription?.daysRemaining ?? null;
  const isTrialEnding =
    isTrialActive && daysRemaining !== null && daysRemaining <= trialEndingDays;

  // Determinar quando mostrar os planos
  // Para gym: sempre mostrar planos quando há subscription (para permitir upgrade/downgrade)
  // Para student: não mostrar upgrade quando Premium via academia; só "mudar para anual" se OWN mensal
  const shouldShowPlans = (() => {
    // Student com Premium via academia: nunca mostrar planos/upgrade
    if (userType === "student" && subscription?.source === "GYM_ENTERPRISE") {
      return false;
    }

    // Se há subscription ativa
    if (subscription && isPremiumActive) {
      // Gym com Enterprise ativo: não mostrar planos (já está no melhor plano)
      if (
        userType === "gym" &&
        String(subscription.plan).toLowerCase().includes("enterprise")
      ) {
        return false;
      }
      // Personal com Pro AI ativo: não mostrar planos (já está no melhor plano)
      if (
        userType === "personal" &&
        String(subscription.plan).toLowerCase().includes("pro_ai")
      ) {
        return false;
      }

      // Para student: mostrar planos para upgrade
      if (userType === "student") {
        const planName = String(subscription.plan).toLowerCase();
        const currentBillingPeriod = subscription.billingPeriod || "monthly";

        // Se for PRO anual, não há upgrade
        if (planName.includes("pro") && currentBillingPeriod === "annual") {
          return false;
        }
        return true;
      }
      // Para gym: sempre mostrar todos os planos (para permitir upgrade/downgrade)
      return true;
    }

    // Se há subscription em trial ou cancelada, mostrar planos normalmente
    if (subscription && (isTrialActive || isCanceled)) {
      // Novamente: se for cancelada mas era Enterprise, talvez ocultar?
      // Por enquanto deixaremos visível para permitir re-assinar se cancelado.
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
  const _displayPrice =
    selectedBillingPeriod === "annual"
      ? selectedPlanData?.annualPrice
      : selectedPlanData?.monthlyPrice;

  // Calcular desconto anual baseado no plano
  const getAnnualDiscount = (planId: string): number => {
    const discounts: Record<string, number> = {
      basic: 5,
      premium: 10,
      enterprise: 15,
      standard: 5,
      pro_ai: 10,
    };
    return discounts[planId] || 10;
  };

  const annualDiscount = selectedPlanData
    ? getAnnualDiscount(selectedPlanData.id)
    : 10;

  const handleSubscribe = async () => {
    if (!selectedPlanData) return;

    // Se o componente pai forneceu um callback, usar ele (mantém consistência)
    if (onSubscribe) {
      await onSubscribe(selectedPlanData.id, selectedBillingPeriod, null);
      return;
    }

    // Fallback para comportamento padrão (checkout direto)
    setIsProcessingPayment(true);
    try {
      console.log(
        "[Subscription] Iniciando checkout direto para:",
        selectedPlanData.id,
        selectedBillingPeriod,
      );
      const result = await createAbacateBilling(
        selectedPlanData.id,
        selectedBillingPeriod,
      );

      if (result?.url) {
        window.location.href = result.url;
      } else {
        throw new Error("URL de checkout não recebida do servidor.");
      }
    } catch (error) {
      console.error("[Subscription] Erro no checkout:", error);
      const message =
        error instanceof Error ? error.message : "Erro ao processar checkout.";
      toast({
        variant: "destructive",
        title: "Erro ao iniciar checkout",
        description: message,
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

      {/* Trial Offer - Apenas se não há subscription (ou expirou) e ainda pode ativar trial (uma vez por conta) */}
      {!isLoading && !isStartingTrial && hasNoSubscription && canStartTrial && (
        <TrialOffer.Simple
          title={finalTexts.trialTitle}
          description={finalTexts.trialDescription}
          buttonText={finalTexts.trialButton}
          isLoading={isLoadingState}
          onStartTrial={onStartTrial}
        />
      )}

      {/* Aluno com Premium gratuito via academia Enterprise — não mostrar planos para assinar */}
      {userType === "student" && subscription?.source === "GYM_ENTERPRISE" && (
        <DuoCard.Root
          variant="default"
          className="border-duo-purple/30 bg-duo-purple/5"
        >
          <div className="p-4">
            <p className="font-bold text-duo-text">
              Você tem plano Premium gratuito
            </p>
            <p className="text-sm text-duo-gray-dark mt-1">
              Incluído por estar cadastrado em{" "}
              <strong>
                {subscription.enterpriseGymName || "sua academia parceira"}
              </strong>
              . Não é necessário assinar um plano próprio.
            </p>
          </div>
        </DuoCard.Root>
      )}

      {/* Subscription Status */}
      {subscription && (
        <SubscriptionStatus.Simple
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
        <PlansSelector.Simple
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

export const SubscriptionSection = {
  Simple: SubscriptionSectionSimple,
};
