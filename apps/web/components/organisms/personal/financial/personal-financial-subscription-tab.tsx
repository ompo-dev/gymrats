"use client";

import { useCallback, useMemo } from "react";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { SubscriptionCancelDialog } from "@/components/organisms/modals/subscription-cancel-dialog";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import { usePersonalFinancial } from "@/hooks/use-personal-financial";
import {
  centsToReais,
  PERSONAL_PLANS_CONFIG,
} from "@/lib/access-control/plans-config";

interface PersonalFinancialSubscriptionTabProps {
  onRefresh?: () => Promise<void>;
}

export function PersonalFinancialSubscriptionTab({
  onRefresh: _onRefresh,
}: PersonalFinancialSubscriptionTabProps = {}) {
  const {
    subscription,
    pixModal,
    setPixModal,
    cancelDialogOpen,
    setCancelDialogOpen,
    handleSubscribe,
    handleCancelConfirm,
    handlePixConfirmed,
    refreshSubscription,
    isSubmitting,
    isCanceling,
  } = usePersonalFinancial();

  const plans = useMemo(
    () =>
      Object.values(PERSONAL_PLANS_CONFIG).map((config) => ({
        id: config.id,
        name: config.name,
        monthlyPrice: centsToReais(config.prices.monthly),
        annualPrice: centsToReais(config.prices.annual),
        features: config.features,
      })),
    [],
  );

  const subscriptionForSection = subscription
    ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status as
          | "active"
          | "canceled"
          | "expired"
          | "past_due"
          | "trialing"
          | "pending_payment",
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
        canceledAt: subscription.canceledAt ?? null,
        trialStart: null as Date | null,
        trialEnd: null as Date | null,
        isTrial: false,
        daysRemaining: null,
        billingPeriod: "monthly" as const,
      }
    : null;

  const handlePaymentSuccess = useCallback(
    async () => refreshSubscription(),
    [refreshSubscription],
  );

  const handleSimulationSuccess = useCallback(
    async () => refreshSubscription(),
    [refreshSubscription],
  );

  const handlePaymentConfirmed = useCallback(async () => {
    await handlePixConfirmed();
  }, [handlePixConfirmed]);

  const pollConfig = useMemo(
    () => ({
      type: "subscription" as const,
      refetch: refreshSubscription,
      currentStatus: subscription?.status,
      initialStatus: "pending_payment",
      targetStatus: "active",
      intervalMs: 3000,
    }),
    [refreshSubscription, subscription?.status],
  );

  const handleCancel = async () => {
    setCancelDialogOpen(true);
  };

  return (
    <>
      <SubscriptionSection.Simple
        userType="personal"
        subscription={subscriptionForSection}
        isLoading={false}
        isStartingTrial={false}
        isCreatingSubscription={isSubmitting}
        isCancelingSubscription={isCanceling}
        onStartTrial={async () => {}}
        onSubscribe={async (plan, billingPeriod) => {
          await handleSubscribe(
            plan as "standard" | "pro_ai",
            billingPeriod as "monthly" | "annual",
          );
        }}
        onCancel={handleCancel}
        onPaymentSuccess={handlePaymentSuccess}
        plans={plans}
        showPlansWhen="always"
        texts={{
          subscriptionStatusTitle: "Status da Assinatura",
          upgradeTitle: "Fazer Upgrade para Pro AI",
          choosePlanTitle: "Escolha seu Plano",
          subscribeButton: "Assinar Agora",
          cancelSubscriptionButton: "Cancelar Assinatura",
          nextRenewal: "Próxima renovação",
        }}
      />

      {pixModal && (
        <PixQrModal
          isOpen={!!pixModal}
          onClose={() => setPixModal(null)}
          title="Pagamento PIX - Assinatura Personal"
          brCode={pixModal.brCode}
          brCodeBase64={pixModal.brCodeBase64}
          amount={pixModal.amount}
          expiresAt={pixModal.expiresAt}
          simulatePixUrl={`/api/personals/subscription/simulate-pix?pixId=${encodeURIComponent(pixModal.pixId)}`}
          onSimulateSuccess={handleSimulationSuccess}
          pollConfig={pollConfig}
          onPaymentConfirmed={handlePaymentConfirmed}
          paymentConfirmedToast={{
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada.",
          }}
        />
      )}

      <SubscriptionCancelDialog.Simple
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        isLoading={isCanceling}
      />
    </>
  );
}
