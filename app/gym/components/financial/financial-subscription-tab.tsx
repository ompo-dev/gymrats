"use client";

import { useGymSubscription } from "@/hooks/use-gym-subscription";
import { SubscriptionSection } from "@/components/subscription-section";

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

export function FinancialSubscriptionTab({
  subscription: initialSubscription,
}: FinancialSubscriptionTabProps) {
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
    subscriptionData &&
    typeof subscriptionData === "object" &&
    "id" in subscriptionData &&
    (subscriptionData as any).id === "temp-trial-id";

  const subscription: SubscriptionType = hasOptimisticUpdate
    ? (subscriptionData as unknown as SubscriptionType)
    : subscriptionData !== undefined
    ? (subscriptionData as unknown as SubscriptionType)
    : initialSubscription;

  const handleStartTrial = async () => {
    try {
      const result = await startTrialHook();
      if (result.error) {
        alert(result.error);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
        await refetchSubscription();
      }
    } catch (error: any) {
      alert(error.message || "Erro ao iniciar trial");
    }
  };

  const handleSubscribe = async (
    plan: string,
    billingPeriod: "monthly" | "annual"
  ) => {
    try {
      const result = await createSubscription(
        plan as "basic" | "premium" | "enterprise",
        billingPeriod
      );
      if (result.error) {
        alert(result.error);
        return;
      }
      if (result.billingUrl) {
        window.location.href = result.billingUrl;
      }
    } catch (error: any) {
      alert(error.message || "Erro ao criar cobrança");
    }
  };

  const handleCancel = async () => {
    if (
      !confirm("Tem certeza que deseja cancelar sua assinatura?")
    ) {
      return;
    }
    try {
      const result = await cancelSubscription();
      if (result.success) {
        await refetchSubscription();
      } else {
        alert(result.error);
      }
    } catch (error: any) {
      alert(error.message || "Erro ao cancelar assinatura");
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
    premium: Math.round(monthlyBasePrices.premium * 12 * 0.90), // 10% desconto
    enterprise: Math.round(monthlyBasePrices.enterprise * 12 * 0.85), // 15% desconto
  };

  return (
    <SubscriptionSection
      userType="gym"
      subscription={subscription ? {
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
      } : null}
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
      showPlansWhen="no-subscription"
      trialEndingDays={3}
      texts={{
        trialTitle: "Experimente 14 dias grátis!",
        trialDescription: "Teste todas as funcionalidades Premium sem compromisso",
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
  );
}

