"use client";

import { Loader2 } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoSelect } from "@/components/duo";
import { PixQrModal } from "@/components/organisms/modals/pix-qr-modal";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

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
  subscription: PersonalSubscriptionDisplay | null;
  onRefresh: () => Promise<void>;
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
  subscription,
  onRefresh,
}: PersonalFinancialPageProps) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useQueryState(
    "subTab",
    parseAsString.withDefault("overview"),
  );
  const [plan, setPlan] = useState("standard");
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixModal, setPixModal] = useState<{
    brCode: string;
    brCodeBase64: string;
    amount: number;
    expiresAt?: string;
  } | null>(null);

  const handleSubscribe = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<{
        subscription: unknown;
        pix?: {
          pixId: string;
          brCode: string;
          brCodeBase64: string;
          amount: number;
          expiresAt: string;
        };
      }>("/api/personals/subscription", {
        plan: plan as "standard" | "pro_ai",
        billingPeriod: billingPeriod as "monthly" | "annual",
      });
      await onRefresh();
      const pix = res.data?.pix;
      if (pix?.brCode && pix?.brCodeBase64) {
        setPixModal({
          brCode: pix.brCode,
          brCodeBase64: pix.brCodeBase64,
          amount: pix.amount,
          expiresAt: pix.expiresAt,
        });
      } else {
        toast({
          title: "Assinatura atualizada",
          description: "Seu plano foi registrado.",
        });
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao contratar";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewMode = subTab === "subscription" ? "subscription" : "overview";

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
        <SlideIn delay={0.2}>
          {subscription ? (
            <DuoCard.Root>
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
            <DuoCard.Root>
              <p className="text-sm text-duo-fg-muted">
                Nenhuma assinatura ativa. Use a aba Assinatura para contratar.
              </p>
            </DuoCard.Root>
          )}
        </SlideIn>
      )}

      {viewMode === "subscription" && (
        <SlideIn delay={0.2}>
        <DuoCard.Root>
          <h3 className="font-semibold text-duo-fg">Plano</h3>
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
            <DuoButton
              onClick={handleSubscribe}
              disabled={isSubmitting}
              variant="primary"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {subscription ? "Atualizar plano" : "Contratar"}
            </DuoButton>
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
            refetch: onRefresh,
            currentStatus: subscription?.status,
            initialStatus: "pending_payment",
            targetStatus: "active",
            intervalMs: 3000,
          }}
          onPaymentConfirmed={() => {
            setPixModal(null);
            onRefresh();
          }}
          paymentConfirmedToast={{
            title: "Pagamento confirmado!",
            description: "Sua assinatura foi ativada.",
          }}
        />
      )}
    </div>
  );
}
