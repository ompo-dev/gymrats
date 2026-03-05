"use client";

import { Building2, Loader2, Target, Users } from "lucide-react";
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoSelect, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { SubscriptionCancelDialog } from "@/components/organisms/modals/subscription-cancel-dialog";
import { usePersonalFinancial } from "@/hooks/use-personal-financial";

export interface PersonalSubscriptionDisplay {
  id: string;
  plan: string;
  status: string;
  basePrice?: number;
  effectivePrice?: number | null;
  discountPercent?: number | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
}

export interface PersonalFinancialPageProps {
  subscription?: PersonalSubscriptionDisplay | null;
  onRefresh?: () => Promise<void>;
}

const PLAN_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "pro_ai", label: "Pro AI" },
];

const BILLING_OPTIONS = [
  { value: "monthly", label: "Mensal" },
  { value: "annual", label: "Anual" },
];

export function PersonalFinancialPage({
  subscription: _subscriptionProp,
  onRefresh,
}: PersonalFinancialPageProps) {
  const {
    subscription,
    stats,
    subTab,
    setSubTab,
    isSubmitting,
    isCanceling,
    pixModal,
    setPixModal,
    cancelDialogOpen,
    setCancelDialogOpen,
    handleSubscribe,
    handleCancelConfirm,
    handlePixConfirmed,
    loadSection,
  } = usePersonalFinancial();

  const [plan, setPlan] = useState("standard");
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const viewMode = subTab === "subscription" ? "subscription" : "overview";
  const canCancel =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Gestão Financeira
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Assinatura e desconto por afiliação a academias Premium/Enterprise
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-duo-fg">Categoria</h2>
          </DuoCard.Header>
          <DuoSelect.Simple
            options={[
              { value: "overview", label: "Resumo" },
              { value: "subscription", label: "Assinatura" },
            ]}
            value={viewMode}
            onChange={(v) => setSubTab(v)}
            placeholder="Selecione a categoria"
          />
        </DuoCard.Root>
      </SlideIn>

      {viewMode === "overview" && (
        <>
          <SlideIn delay={0.15}>
            <DuoStatsGrid.Root columns={2} className="gap-4">
              <DuoStatCard.Simple
                icon={Building2}
                value={String(stats.gyms)}
                label="Academias"
                iconColor="var(--duo-primary)"
              />
              <DuoStatCard.Simple
                icon={Users}
                value={String(stats.students)}
                label="Alunos"
                iconColor="var(--duo-secondary)"
              />
              <DuoStatCard.Simple
                icon={Target}
                value={String(stats.studentsViaGym)}
                label="Via academia"
                iconColor="var(--duo-accent)"
              />
              <DuoStatCard.Simple
                icon={Users}
                value={String(stats.independentStudents)}
                label="Independentes"
                iconColor="#A560E8"
              />
            </DuoStatsGrid.Root>
          </SlideIn>
          <SlideIn delay={0.2}>
            {subscription ? (
              <DuoCard.Root variant="default" padding="md">
                <p className="text-sm text-duo-fg-muted">Plano atual</p>
                <p className="text-xl font-bold text-duo-fg">
                  {subscription.plan === "pro_ai" ? "Pro AI" : "Standard"}
                </p>
                <p className="mt-1 text-sm text-duo-fg-muted">
                  Status: {subscription.status}
                </p>
                {subscription.effectivePrice != null && (
                  <p className="mt-1 text-sm text-duo-fg">
                    Valor efetivo: R${" "}
                    {Number(subscription.effectivePrice).toFixed(2)}/mês
                    {subscription.discountPercent
                      ? ` (${subscription.discountPercent}% de desconto)`
                      : ""}
                  </p>
                )}
                <p className="mt-1 text-xs text-duo-fg-muted">
                  Próximo vencimento:{" "}
                  {new Date(
                    subscription.currentPeriodEnd,
                  ).toLocaleDateString("pt-BR")}
                </p>
              </DuoCard.Root>
            ) : (
              <DuoCard.Root variant="default" padding="md">
                <p className="text-sm text-duo-fg-muted">
                  Nenhuma assinatura ativa. Use a aba Assinatura para contratar.
                </p>
              </DuoCard.Root>
            )}
          </SlideIn>
        </>
      )}

      {viewMode === "subscription" && (
        <SlideIn delay={0.2}>
          <DuoCard.Root variant="default" padding="md">
            <DuoCard.Header>
              <h3 className="font-semibold text-duo-fg">Plano</h3>
            </DuoCard.Header>
            <div className="mt-3 space-y-3">
              <DuoSelect.Simple
                label="Plano"
                value={plan}
                onChange={setPlan}
                options={PLAN_OPTIONS}
              />
              <DuoSelect.Simple
                label="Cobrança"
                value={billingPeriod}
                onChange={setBillingPeriod}
                options={BILLING_OPTIONS}
              />
              <div className="flex flex-wrap gap-3">
                <DuoButton
                  onClick={() =>
                    handleSubscribe(
                      plan as "standard" | "pro_ai",
                      billingPeriod as "monthly" | "annual",
                    )
                  }
                  disabled={isSubmitting}
                  variant="primary"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {subscription ? "Atualizar plano" : "Contratar"}
                </DuoButton>
                {canCancel && (
                  <DuoButton
                    variant="outline"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={isCanceling}
                  >
                    Cancelar assinatura
                  </DuoButton>
                )}
              </div>
            </div>
          </DuoCard.Root>
        </SlideIn>
      )}

      {pixModal && (
        <PixQrModal
          isOpen={!!pixModal}
          onClose={() => setPixModal(null)}
          title="Pagamento PIX - Assinatura Personal"
          brCode={pixModal.brCode}
          brCodeBase64={pixModal.brCodeBase64}
          amount={pixModal.amount}
          expiresAt={pixModal.expiresAt}
          pollConfig={{
            type: "subscription",
            refetch: () => loadSection("subscription"),
            currentStatus: subscription?.status,
            initialStatus: "pending_payment",
            targetStatus: "active",
            intervalMs: 3000,
          }}
          onPaymentConfirmed={() => {
            handlePixConfirmed();
            onRefresh?.();
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
    </div>
  );
}
