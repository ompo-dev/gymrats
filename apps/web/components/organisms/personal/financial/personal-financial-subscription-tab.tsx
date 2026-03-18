"use client";

import { useMemo } from "react";
import {
  PERSONAL_PLANS_CONFIG,
  centsToReais,
} from "@/lib/access-control/plans-config";
import { SubscriptionSection } from "@/components/organisms/sections/subscription-section";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { SubscriptionCancelDialog } from "@/components/organisms/modals/subscription-cancel-dialog";
import { usePersonalFinancial } from "@/hooks/use-personal-financial";

interface PersonalFinancialSubscriptionTabProps {
  onRefresh?: () => Promise<void>;
}

export function PersonalFinancialSubscriptionTab({
  onRefresh,
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
    isSubmitting,
    isCanceling,
    loadSection,
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
        onPaymentSuccess={async () => loadSection("subscription", true)}
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
          onSimulateSuccess={() => loadSection("subscription", true)}
          pollConfig={{
            type: "subscription",
            refetch: () => loadSection("subscription", true),
            currentStatus: subscription?.status,
            initialStatus: "pending_payment",
            targetStatus: "active",
            intervalMs: 3000,
          }}
          onPaymentConfirmed={async () => {
            handlePixConfirmed();
            await onRefresh?.();
          }}
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
