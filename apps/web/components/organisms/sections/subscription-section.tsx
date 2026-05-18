"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { DuoCard } from "@/components/duo";
import { useStudent } from "@/hooks/use-student";
import { useToast } from "@/hooks/use-toast";
import { confirmAbacatePayment } from "@/lib/actions/payments/abacate-pay";
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
  perStudentPrice?: number; // Preco por aluno/mes (apenas para gym, plano mensal)
  perPersonalPrice?: number; // Preco por personal filiado/mes (apenas para gym)
}

export interface SubscriptionSectionProps {
  userType: "student" | "gym" | "personal";

  /** Subscription do student ou gym; datas e id podem ser opcionais (ex.: virtual enterprise). Gym pode passar activeStudents/totalAmount. */
  subscription?:
    | (StudentSubscriptionData & {
        activeStudents?: number;
        activePersonals?: number;
        basePrice?: number;
        pricePerStudent?: number;
        pricePerPersonal?: number;
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
  /** Chamado apos confirmar pagamento (ex.: refetch da assinatura). Para gym, passar refetch do useGymSubscription. */
  onPaymentSuccess?: () => Promise<void>;

  // Configuracoes de planos
  plans: SubscriptionPlan[];

  // Textos customizaveis
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

  // Configuracoes de exibicao
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
    setSelectedPlan,
    setSelectedBillingPeriod,
    setIsProcessingPayment,
    initializeFromSubscription,
  } = useSubscriptionUIStore();

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const { loadSubscription } = useStudent("loaders");
  const latestSubscriptionStatusRef = useRef<string | undefined>(
    subscription?.status,
  );
  const hasHandledSuccessParamRef = useRef(false);

  useEffect(() => {
    latestSubscriptionStatusRef.current = subscription?.status;
  }, [subscription?.status]);

  // Efeito para confirmar pagamento e ativar assinatura quando volta do Abacate Pay com sucesso
  useEffect(() => {
    if (!isSuccess) {
      hasHandledSuccessParamRef.current = false;
      return;
    }

    if (hasHandledSuccessParamRef.current) {
      return;
    }

    hasHandledSuccessParamRef.current = true;
    let cancelled = false;

    const clearSuccessParam = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    };

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const confirmPayment = async () => {
      toast({
        title: "Pagamento recebido!",
        description: "Verificando e ativando sua assinatura...",
      });

      // Para gym/personal: webhook ativa a assinatura. So confirmar sucesso se status ficar active.
      if (userType !== "student") {
        if (latestSubscriptionStatusRef.current === "active") {
          toast({
            title: "Assinatura Ativada! 🎉",
            description: "Seu plano esta ativo. Aproveite!",
          });
          clearSuccessParam();
          return;
        }

        if (!onPaymentSuccess) {
          toast({
            variant: "destructive",
            title: "Nao foi possivel confirmar o pagamento",
            description:
              "A assinatura ainda esta pendente. Atualize em alguns instantes.",
          });
          clearSuccessParam();
          return;
        }

        for (let i = 0; i < 10; i++) {
          if (cancelled) return;
          await onPaymentSuccess();

          if (latestSubscriptionStatusRef.current === "active") {
            toast({
              title: "Assinatura Ativada! 🎉",
              description: "Seu plano esta ativo. Aproveite!",
            });
            clearSuccessParam();
            return;
          }

          await sleep(2000);
        }

        await onPaymentSuccess();

        if (cancelled) return;

        if (latestSubscriptionStatusRef.current === "active") {
          toast({
            title: "Assinatura Ativada! 🎉",
            description: "Seu plano esta ativo. Aproveite!",
          });
        } else {
          toast({
            title: "Pagamento em processamento",
            description:
              "Ainda nao identificamos a ativacao. Atualize novamente em alguns instantes.",
          });
        }

        clearSuccessParam();
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
              description: `Seu plano ${result.subscription?.plan || "Premium"} esta ativo. Aproveite!`,
            });
            clearSuccessParam();
            return;
          }
        } catch (error) {
          void error;
        }

        await sleep(3000);
      }

      await loadSubscription();
      if (!cancelled) {
        toast({
          title: "Pagamento em processamento",
          description:
            "Ainda nao identificamos a ativacao. Tente atualizar em alguns instantes.",
        });
        clearSuccessParam();
      }
    };

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [isSuccess, loadSubscription, toast, userType, onPaymentSuccess]);

  // Inicializar estado baseado na subscription atual
  const prevSubscriptionId = useRef<string | null>(null);
  const plansRef = useRef(plans);

  useEffect(() => {
    plansRef.current = plans;
  }, [plans]);

  useEffect(() => {
    if (plansRef.current.length > 0) {
      // Apenas re-inicializar se a assinatura mudou de verdade (ID ou plano base)
      const subId = subscription?.id || "no-subscription";
      const subPlan = subscription?.plan || "free";
      const subPeriod = subscription?.billingPeriod || "monthly";
      const checkKey = `${subId}-${subPlan}-${subPeriod}`;

      if (prevSubscriptionId.current !== checkKey) {
        initializeFromSubscription(
          plansRef.current,
          subscription?.plan,
          subscription?.billingPeriod,
          userType,
        );
        prevSubscriptionId.current = checkKey;
      }
    }
  }, [
    subscription?.id,
    subscription?.plan,
    subscription?.billingPeriod,
    userType,
    initializeFromSubscription,
  ]);

  // Textos padrao
  const defaultTexts = {
    trialTitle: "Experimente 14 dias gratis!",
    trialDescription: "Teste todas as funcionalidades Premium sem compromisso",
    trialButton: "Iniciar Trial Gratis",
    trialDaysRemaining: "dias restantes",
    trialValidUntil: "Valido ate",
    subscriptionStatusTitle: "Status da Assinatura",
    upgradeTitle: "Fazer Upgrade para Premium",
    choosePlanTitle: "Escolha seu Plano",
    subscribeButton: "Assinar Agora",
    cancelTrialButton: "Cancelar Trial",
    cancelSubscriptionButton: "Cancelar Assinatura",
    nextRenewal: "Proxima renovacao",
    monthlyLabel: "Mensal",
    annualLabel: "Anual",
    saveLabel: "Economize",
    perMonth: "por mes",
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

  // Trial so uma vez: ocultar oferta se ja usou trial ou ja assinou (canStartTrial === false)
  // Personal nao tem trial
  const canStartTrial =
    userType === "personal"
      ? false
      : subscription == null ||
        ("canStartTrial" in subscription &&
          subscription.canStartTrial !== false);

  const daysRemaining = subscription?.daysRemaining ?? null;
  const isTrialEnding =
    isTrialActive && daysRemaining !== null && daysRemaining <= trialEndingDays;

  const resolveStudentBillingPeriod = (
    currentSubscription: SubscriptionSectionProps["subscription"],
  ): "monthly" | "annual" => {
    if (!currentSubscription) {
      return "monthly";
    }

    if (
      currentSubscription.billingPeriod === "monthly" ||
      currentSubscription.billingPeriod === "annual"
    ) {
      return currentSubscription.billingPeriod;
    }

    const planName = String(currentSubscription.plan || "").toLowerCase();
    if (planName.includes("anual") || planName.includes("annual")) {
      return "annual";
    }

    return "monthly";
  };

  // Determinar quando mostrar os planos
  // Para gym: sempre mostrar planos quando ha subscription (para permitir upgrade/downgrade)
  // Para student: nao mostrar upgrade quando Premium via academia; so "mudar para anual" se OWN mensal
  const shouldShowPlans = (() => {
    // Student com Premium via academia: nunca mostrar planos/upgrade
    if (userType === "student" && subscription?.source === "GYM_ENTERPRISE") {
      return false;
    }

    // Se ha subscription ativa
    if (subscription && isPremiumActive) {
      // Gym com Enterprise ativo: nao mostrar planos (ja esta no melhor plano)
      if (
        userType === "gym" &&
        String(subscription.plan).toLowerCase().includes("enterprise")
      ) {
        return false;
      }
      // Personal com Pro AI ativo: nao mostrar planos (ja esta no melhor plano)
      if (
        userType === "personal" &&
        String(subscription.plan).toLowerCase().includes("pro_ai")
      ) {
        return false;
      }

      // Para student: mostrar planos para upgrade
      if (userType === "student") {
        const currentBillingPeriod = resolveStudentBillingPeriod(subscription);
        return currentBillingPeriod === "monthly";
      }
      // Para gym: sempre mostrar todos os planos (para permitir upgrade/downgrade)
      return true;
    }

    // Se ha subscription em trial ou cancelada, mostrar planos normalmente
    if (subscription && (isTrialActive || isCanceled)) {
      // Novamente: se for cancelada mas era Enterprise, talvez ocultar?
      // Por enquanto deixaremos visivel para permitir re-assinar se cancelado.
      return true;
    }

    // Se nao ha subscription, mostrar baseado na configuracao
    switch (showPlansWhen) {
      case "always":
        // Para student com subscription ativa anual, nao mostrar mesmo com "always"
        if (userType === "student" && subscription && isPremiumActive) {
          const currentBillingPeriod =
            resolveStudentBillingPeriod(subscription);
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

    setIsProcessingPayment(true);
    try {
      await onSubscribe(selectedPlanData.id, selectedBillingPeriod, null);
    } catch (error) {
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

      {/* Trial Offer - Apenas se nao ha subscription (ou expirou) e ainda pode ativar trial (uma vez por conta) */}
      {!isLoading && !isStartingTrial && hasNoSubscription && canStartTrial && (
        <TrialOffer.Simple
          title={finalTexts.trialTitle}
          description={finalTexts.trialDescription}
          buttonText={finalTexts.trialButton}
          isLoading={isLoadingState}
          onStartTrial={onStartTrial}
        />
      )}

      {/* Aluno com Premium gratuito via academia Enterprise - nao mostrar planos para assinar */}
      {userType === "student" && subscription?.source === "GYM_ENTERPRISE" && (
        <DuoCard.Root
          variant="default"
          className="border-duo-purple/30 bg-duo-purple/5"
        >
          <div className="p-4">
            <p className="font-bold text-duo-text">
              Voce tem plano Premium gratuito
            </p>
            <p className="text-sm text-duo-gray-dark mt-1">
              Incluido por estar cadastrado em{" "}
              <strong>
                {subscription.enterpriseGymName || "sua academia parceira"}
              </strong>
              . Nao e necessario assinar um plano proprio.
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
                ? ("monthly" as "monthly" | "annual") // Default para monthly se nao tiver billingPeriod
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
